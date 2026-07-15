import { mockReviews } from "../mocks/reviews.js";
import { readCollection, writeCollection, nextPrefixedId } from "./localStore.js";
import { getCurrentUser } from "./auth.service.js";

// Servicio de reseñas.
//
// Antes era el único servicio sin persistencia: leía los mocks y punto, así
// que no se podían escribir comentarios. Ahora usa localStore como el resto,
// y las reseñas semilla son solo el contenido inicial de la colección.
//
// Regla de negocio: una reseña por usuario y POI. Es lo que hace que
// reviewCount signifique algo y evita que una cuenta llene el hilo.
//
// ── ENDPOINTS esperados (backend) ─────────────────────────────
//   GET    /pois/:poiId/reviews      → reseñas del POI
//   POST   /pois/:poiId/reviews      → publicar { rating, text }
//   DELETE /me/reviews/:id           → borrar la propia
// ──────────────────────────────────────────────────────────────

const COLLECTION = "reviews";

export const REVIEW_MAX_LENGTH = 500;
const REVIEW_MIN_LENGTH = 10;

// Los mocks vienen indexados por POI porque así se leen mejor a mano; la
// colección necesita una lista plana, con el poiId dentro de cada entrada.
const seedReviews = Object.entries(mockReviews).flatMap(([poiId, list]) =>
  list.map((review) => ({ ...review, poiId: String(poiId), userId: null }))
);

/**
 * Lee todas las reseñas de todos los POIs.
 * @returns {Array<Object>}
 */
function readAll() {
  return readCollection(COLLECTION, seedReviews);
}

/**
 * Iniciales para el avatar, a partir del nombre.
 * @param {string} name
 * @returns {string}
 */
function initialsOf(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Obtiene las reseñas de un POI, de la más reciente a la más antigua.
 * Marca con isMine la del usuario con sesión para que la vista la destaque.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<Array<Object>>}
 */
export async function getPoiReviews(poiId) {
  const user = getCurrentUser();
  const id = String(poiId);

  return readAll()
    .filter((review) => String(review.poiId) === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((review) => ({
      ...review,
      isMine: Boolean(user && review.userId && review.userId === user.id),
    }));
}

/**
 * Reseña que el usuario con sesión ya escribió sobre un POI, si existe.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<Object|null>}
 */
export async function getMyReviewFor(poiId) {
  const user = getCurrentUser();
  if (!user) return null;

  const id = String(poiId);
  const mine = readAll().find(
    (review) => String(review.poiId) === id && review.userId === user.id
  );

  return mine ? { ...mine } : null;
}

/**
 * Publica una reseña del usuario con sesión sobre un POI.
 * @param {number|string} poiId - ID del POI.
 * @param {Object} data - Contenido.
 * @param {number} data.rating - Valoración de 1 a 5.
 * @param {string} data.text - Cuerpo del comentario.
 * @returns {Promise<{ok: boolean, review?: Object, error?: string}>}
 */
export async function createReview(poiId, { rating, text }) {
  const user = getCurrentUser();
  if (!user) {
    return { ok: false, error: "Necesitas iniciar sesión para comentar." };
  }

  const score = Number(rating);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { ok: false, error: "Elige una valoración de 1 a 5 estrellas." };
  }

  const body = String(text ?? "").trim();
  if (body.length < REVIEW_MIN_LENGTH) {
    return { ok: false, error: `Cuéntanos un poco más (mínimo ${REVIEW_MIN_LENGTH} caracteres).` };
  }
  if (body.length > REVIEW_MAX_LENGTH) {
    return { ok: false, error: `El comentario no puede pasar de ${REVIEW_MAX_LENGTH} caracteres.` };
  }

  const all = readAll();
  const id = String(poiId);

  const alreadyReviewed = all.some(
    (review) => String(review.poiId) === id && review.userId === user.id
  );
  if (alreadyReviewed) {
    return { ok: false, error: "Ya has comentado este lugar." };
  }

  const review = {
    id: nextPrefixedId(all, "REV"),
    poiId: id,
    userId: user.id,
    author: user.name,
    initials: initialsOf(user.name),
    rating: score,
    text: body,
    createdAt: new Date().toISOString(),
  };

  writeCollection(COLLECTION, [...all, review]);
  return { ok: true, review };
}

/**
 * Borra una reseña propia.
 * @param {string} reviewId - ID de la reseña.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deleteMyReview(reviewId) {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: "No hay sesión iniciada." };

  const all = readAll();
  const target = all.find((review) => review.id === reviewId);

  if (!target) return { ok: false, error: "No encontramos ese comentario." };
  if (target.userId !== user.id) {
    return { ok: false, error: "Solo puedes borrar tus propios comentarios." };
  }

  writeCollection(
    COLLECTION,
    all.filter((review) => review.id !== reviewId)
  );
  return { ok: true };
}
