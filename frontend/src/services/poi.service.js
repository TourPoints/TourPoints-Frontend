import { mockPois } from "../mocks/pois.js";
import { apiGet, isApiEnabled, ApiError } from "./api.client.js";
import { readCollection, writeCollection, nextNumericId } from "./localStore.js";

// Servicio de Puntos de Interés.
//
// Si hay backend configurado (VITE_API_URL) se consulta la API real; si no,
// se opera sobre localStorage sembrado con los mocks. Las vistas usan siempre
// esta misma interfaz, así que el día que exista el backend no cambian.
//
// ── ENDPOINTS esperados (backend) ────────────────────────────────
//   GET    /pois              → POIs publicados (vista pública)
//   GET    /admin/pois        → todos los POIs, cualquier estado
//   GET    /pois/:id          → detalle
//   POST   /admin/pois        → crear
//   PUT    /admin/pois/:id    → editar
//   DELETE /admin/pois/:id    → eliminar
// ─────────────────────────────────────────────────────────────────

const COLLECTION = "pois";

/** Estados posibles de un POI. Solo los "Activo" se muestran al público. */
export const POI_STATUSES = ["Activo", "Pendiente", "Inactivo"];
export const PUBLISHED_STATUS = "Activo";

/**
 * Devuelve los POIs visibles para el público: solo los publicados.
 * La usan el mapa y la vista de exploración.
 * @param {Object} [filters] - Filtros opcionales que el backend podrá aplicar.
 * @returns {Promise<Array>} POIs publicados.
 */
export async function getPois(filters = {}) {
  // "pois" aún no está en API_MODULES: el backend no expone /poi todavía.
  // Cuando lo haga, este servicio se adapta a su contrato y se añade el
  // módulo a config/api.js — las vistas no cambian.
  if (isApiEnabled("pois")) {
    return apiGet("/pois", { category: filters.category, q: filters.query });
  }

  return readCollection(COLLECTION, mockPois).filter(
    (poi) => poi.status === PUBLISHED_STATUS
  );
}

/**
 * Devuelve todos los POIs sin importar su estado. Uso exclusivo del panel admin.
 * @returns {Promise<Array>} Todos los POIs.
 */
export async function getAllPois() {
  if (isApiEnabled("pois")) {
    return apiGet("/admin/pois");
  }

  return readCollection(COLLECTION, mockPois);
}

/**
 * Obtiene los detalles de un POI por su ID.
 * @param {number|string} id - ID del POI.
 * @returns {Promise<Object|null>} El POI, o null si no existe.
 */
export async function getPoiById(id) {
  if (isApiEnabled("pois")) {
    try {
      return await apiGet(`/pois/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  const poi = readCollection(COLLECTION, mockPois).find(
    (item) => String(item.id) === String(id)
  );
  return poi ? { ...poi } : null;
}

/**
 * Crea un POI nuevo.
 * @param {Object} data - Datos del formulario.
 * @returns {Promise<Object>} El POI creado, ya con su id.
 */
export async function createPoi(data) {
  const pois = readCollection(COLLECTION, mockPois);

  const poi = {
    ...data,
    id: nextNumericId(pois),
    rating: Number(data.rating) || 0,
    reviewCount: 0,
    points: Number(data.points) || 0,
    lat: Number(data.lat),
    lng: Number(data.lng),
    images: data.image ? [data.image] : [],
  };

  writeCollection(COLLECTION, [...pois, poi]);
  return poi;
}

/**
 * Actualiza un POI existente.
 * @param {number|string} id - ID del POI.
 * @param {Object} changes - Campos a modificar.
 * @returns {Promise<Object|null>} El POI actualizado, o null si no existe.
 */
export async function updatePoi(id, changes) {
  const pois = readCollection(COLLECTION, mockPois);
  const index = pois.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;

  const updated = {
    ...pois[index],
    ...changes,
    id: pois[index].id,
    points: changes.points !== undefined ? Number(changes.points) : pois[index].points,
    rating: changes.rating !== undefined ? Number(changes.rating) : pois[index].rating,
    lat: changes.lat !== undefined ? Number(changes.lat) : pois[index].lat,
    lng: changes.lng !== undefined ? Number(changes.lng) : pois[index].lng,
  };

  pois[index] = updated;
  writeCollection(COLLECTION, pois);
  return updated;
}

/**
 * Elimina un POI.
 * @param {number|string} id - ID del POI.
 * @returns {Promise<boolean>} true si se eliminó algo.
 */
export async function deletePoi(id) {
  const pois = readCollection(COLLECTION, mockPois);
  const remaining = pois.filter((item) => String(item.id) !== String(id));

  if (remaining.length === pois.length) return false;

  writeCollection(COLLECTION, remaining);
  return true;
}

/**
 * Alterna el estado de un POI entre Activo e Inactivo.
 * @param {number|string} id - ID del POI.
 * @returns {Promise<Object|null>} El POI actualizado.
 */
export async function togglePoiStatus(id) {
  const poi = await getPoiById(id);
  if (!poi) return null;

  const nextStatus = poi.status === PUBLISHED_STATUS ? "Inactivo" : PUBLISHED_STATUS;
  return updatePoi(id, { status: nextStatus });
}
