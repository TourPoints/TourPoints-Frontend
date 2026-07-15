import { readCollection, writeCollection } from "./localStore.js";
import { getCurrentUser } from "./auth.service.js";

// Favoritos por usuario.
//
// Antes se guardaba una lista plana de ids sin dueño: al cambiar de cuenta
// el nuevo usuario heredaba los favoritos del anterior. Ahora cada entrada
// lleva su userId, igual que el progreso de retos en challengeProgress.service.
//
// Se apoya en localStore en vez de tocar localStorage directamente, para
// compartir el prefijo y el versionado de semillas con el resto de servicios.
//
// ── ENDPOINTS esperados (backend) ─────────────────────────────
//   GET    /me/favorites          → POIs guardados por el usuario
//   POST   /me/favorites/:poiId   → guardar
//   DELETE /me/favorites/:poiId   → quitar
// ──────────────────────────────────────────────────────────────

const COLLECTION = "favorites";

/**
 * Lee todas las entradas de favoritos (de todas las cuentas).
 * Cada entrada: { userId, poiId, createdAt }.
 *
 * Descarta lo que guardó la versión anterior (una lista plana de ids sueltos):
 * sin userId no hay forma de saber de quién era cada favorito, así que no se
 * puede migrar. Al primer guardado la colección queda ya limpia.
 * @returns {Array<Object>}
 */
function readAll() {
  return readCollection(COLLECTION, []).filter(
    (entry) => entry && typeof entry === "object" && entry.userId
  );
}

/**
 * Ids de los POIs que el usuario con sesión tiene guardados.
 * @returns {Set<string>} Ids como texto; vacío si no hay sesión.
 */
export function getMyFavoriteIds() {
  const user = getCurrentUser();
  if (!user) return new Set();

  return new Set(
    readAll()
      .filter((entry) => entry.userId === user.id)
      .map((entry) => String(entry.poiId))
  );
}

/**
 * Entradas de favoritos del usuario, de la más reciente a la más antigua.
 * La vista de favoritos las cruza con poi.service para pintar las tarjetas.
 * @returns {Array<Object>} Entradas { userId, poiId, createdAt }.
 */
export function getMyFavoriteEntries() {
  const user = getCurrentUser();
  if (!user) return [];

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
