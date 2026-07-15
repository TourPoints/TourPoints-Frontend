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

/**
 * Agrega una nueva reseña a un Punto de Interés.
 * @param {number|string} poiId - ID del POI.
 * @param {Object} review - Objeto con los datos de la reseña.
 * @returns {Promise<Object>} Promesa con el resultado de la operación.
 */
export async function addPoiReview(poiId, review) {
  const id = Number(poiId);
  if (!mockReviews[id]) {
    mockReviews[id] = [];
  }
  
  const newReview = {
    id: Date.now(),
    date: "Justo ahora",
    ...review
  };

  mockReviews[id].unshift(newReview);
  return Promise.resolve({ success: true, message: "Comentario publicado con éxito", review: newReview });
}
