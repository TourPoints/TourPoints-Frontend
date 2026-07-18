import { readCollection, writeCollection } from "./localStore.js";
import { getCurrentUser } from "./auth.service.js";
import { apiGetItems, apiPost, apiDelete, isApiEnabled, ApiError } from "./api.client.js";

// Favoritos por usuario. Cableado al backend real (docs/CABLEADO.md).
//
// Contra la API: POST /favorites, DELETE /favorites/{poi_id} y
// GET /favorites/me. Como varias vistas pintan corazones en mitad de un
// render síncrono, el servicio mantiene una caché en memoria de los ids del
// servidor: las vistas llaman a refreshMyFavorites() al inicializarse (una
// petición) y el resto del pintado sigue siendo instantáneo.
//
// Sin backend, cada entrada vive en localStorage con su userId, como antes.

const COLLECTION = "favorites";

// Caché de ids en modo API, ligada al usuario que la llenó: al cambiar de
// cuenta o cerrar sesión deja de valer sola, sin necesitar eventos de logout.
let cacheIds = new Set();
let cacheUserId = null;

const cacheValida = () => {
  const user = getCurrentUser();
  return Boolean(user) && cacheUserId === user.id;
};

/**
 * Lee todas las entradas de favoritos locales (todas las cuentas).
 * @returns {Array<Object>} Entradas { userId, poiId, createdAt }.
 */
function readAll() {
  return readCollection(COLLECTION, []).filter(
    (entry) => entry && typeof entry === "object" && entry.userId
  );
}

/**
 * Trae del backend los favoritos del usuario y actualiza la caché.
 * Las vistas la llaman al inicializarse; en modo local no hace nada.
 * @returns {Promise<Array<Object>>} Entradas { poiId, createdAt }.
 */
export async function refreshMyFavorites() {
  const user = getCurrentUser();
  if (!user || !isApiEnabled("favorites")) return [];

  try {
    const items = await apiGetItems("/favorites/me");
    // El backend puede responder la tabla puente ({poi_id}) o el resumen del
    // POI ({id, nombre...}): se aceptan ambas formas.
    const entries = items.map((item) => ({
      poiId: String(item.poi_id ?? item.id),
      createdAt: item.created_at ?? null,
    }));
    cacheIds = new Set(entries.map((e) => e.poiId));
    cacheUserId = user.id;
    return entries;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      cacheIds = new Set();
      cacheUserId = null;
      return [];
    }
    throw error;
  }
}

/**
 * Ids de los POIs que el usuario con sesión tiene guardados.
 * Síncrona a propósito: los renders la consultan en caliente. En modo API lee
 * la caché que llenó refreshMyFavorites().
 * @returns {Set<string>} Ids como texto; vacío si no hay sesión.
 */
export function getMyFavoriteIds() {
  const user = getCurrentUser();
  if (!user) return new Set();

  if (isApiEnabled("favorites")) {
    return cacheValida() ? new Set(cacheIds) : new Set();
  }

  return new Set(
    readAll()
      .filter((entry) => entry.userId === user.id)
      .map((entry) => String(entry.poiId))
  );
}

/**
 * Entradas de favoritos del usuario, de la más reciente a la más antigua.
 * @returns {Promise<Array<Object>>} Entradas { poiId, createdAt }.
 */
export async function getMyFavoriteEntries() {
  const user = getCurrentUser();
  if (!user) return [];

  if (isApiEnabled("favorites")) {
    const entries = await refreshMyFavorites();
    return entries.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
  }

  return readAll()
    .filter((entry) => entry.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Comprueba si un POI está entre los favoritos del usuario actual.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<boolean>} false si no hay sesión.
 */
export async function isFavorite(poiId) {
  const user = getCurrentUser();
  if (!user) return false;

  if (isApiEnabled("favorites") && !cacheValida()) {
    await refreshMyFavorites();
  }
  return getMyFavoriteIds().has(String(poiId));
}

/**
 * Guarda o quita un POI de los favoritos del usuario actual.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<{ok: boolean, isFavorite: boolean}>} ok es false si no hay sesión.
 */
export async function toggleFavorite(poiId) {
  const user = getCurrentUser();
  if (!user) return { ok: false, isFavorite: false };

  const id = String(poiId);

  if (isApiEnabled("favorites")) {
    if (!cacheValida()) await refreshMyFavorites();
    const saved = cacheIds.has(id);

    try {
      if (saved) {
        await apiDelete(`/favorites/${id}`);
        cacheIds.delete(id);
        return { ok: true, isFavorite: false };
      }
      await apiPost("/favorites", { poi_id: id });
      cacheIds.add(id);
      cacheUserId = user.id;
      return { ok: true, isFavorite: true };
    } catch (error) {
      // Si el servidor y la caché discrepan (guardado en otra pestaña), se
      // resincroniza y se informa el estado real en vez de fallar.
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        await refreshMyFavorites();
        return { ok: true, isFavorite: cacheIds.has(id) };
      }
      console.error("Favorito contra la API falló:", error);
      return { ok: false, isFavorite: saved };
    }
  }

  const all = readAll();
  const isSaved = all.some(
    (entry) => entry.userId === user.id && String(entry.poiId) === id
  );

  if (isSaved) {
    const remaining = all.filter(
      (entry) => !(entry.userId === user.id && String(entry.poiId) === id)
    );
    writeCollection(COLLECTION, remaining);
    return { ok: true, isFavorite: false };
  }

  writeCollection(COLLECTION, [
    ...all,
    { userId: user.id, poiId: id, createdAt: new Date().toISOString() },
  ]);
  return { ok: true, isFavorite: true };
}
