import { mockReviews } from "../mocks/reviews.js";

/**
 * Obtiene las reseñas de un Punto de Interés.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<Array>} Promesa con la lista de reseñas.
 */
export async function getPoiReviews(poiId) {
  // TODO: Reemplazar con fetch(`/api/pois/${poiId}/reviews`) cuando el backend esté listo
  const reviews = mockReviews[Number(poiId)] || [];
  return Promise.resolve([...reviews]);
}
