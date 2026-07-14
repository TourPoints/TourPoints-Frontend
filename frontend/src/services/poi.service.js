import { mockPois } from "../mocks/pois.js";

// Servicio para gestionar los Puntos de Interés (POI)
// En el futuro, las llamadas locales se reemplazarán por peticiones fetch a la API del backend.

/**
 * Obtiene la lista completa de Puntos de Interés.
 * @returns {Promise<Array>} Promesa con la lista de POIs.
 */
export async function getPois() {
  // TODO: Reemplazar con fetch('/api/pois') cuando el backend esté listo
  return Promise.resolve([...mockPois]);
}

/**
 * Obtiene los detalles de un Punto de Interés específico por su ID.
 * @param {number|string} id - ID del POI.
 * @returns {Promise<Object|null>} Promesa con el objeto POI o null si no existe.
 */
export async function getPoiById(id) {
  // TODO: Reemplazar con fetch(`/api/pois/${id}`) cuando el backend esté listo
  const poi = mockPois.find((item) => item.id === Number(id));
  return Promise.resolve(poi ? { ...poi } : null);
}
