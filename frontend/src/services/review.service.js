import { mockReviews } from "../mocks/reviews.js";
import { readCollection, writeCollection, nextPrefixedId } from "./localStore.js";
import { getCurrentUser } from "./auth.service.js";
import { apiGetItems, apiPost, apiPut, apiDelete, isApiEnabled, ApiError } from "./api.client.js";

// Servicio de reseñas. Cableado al backend real (docs/CABLEADO.md).
//
// El backend parte "la reseña" en dos entidades — y es mejor diseño, así que
// se adopta: la calificación (PUT /poi/{id}/my-rating, única por usuario y
// POI) y el comentario (POST /poi/{id}/comments, que nace PENDIENTE hasta que
// un admin lo apruebe). El formulario sigue siendo un solo gesto: por debajo
// se hacen las dos llamadas, y la vista avisa de que el comentario queda en
// moderación en vez de aparecer al instante.
//
// Sin backend, el modo local de siempre: una reseña por usuario y POI en
// localStorage, con las semillas como contenido inicial.

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

/** ComentarioOut del backend → tarjeta de reseña del frontend. */
function adaptComentario(c, userId) {
  const author = c.usuario?.nombre ?? "Visitante";
  return {
    id: c.id,
    author,
    initials: initialsOf(author),
    // La calificación vive en otra entidad (calificaciones); el comentario
    // no trae estrellas. La tarjeta las omite cuando no hay valoración.
    rating: null,
    text: c.contenido,
    createdAt: c.created_at,
    isMine: Boolean(userId && c.usuario?.id === userId),
  };
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

  if (isApiEnabled("reviews")) {
    try {
      const items = await apiGetItems(`/poi/${id}/comments`);
      return items
        .map((c) => adaptComentario(c, user?.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      // Sin sesión el backend puede negar la lista: la sección queda vacía
      // en vez de romper el detalle entero.
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return [];
      throw error;
    }
  }

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

  // Contra el backend no hay forma barata de saberlo (la lista pública solo
  // trae APROBADOS y el propio puede estar PENDIENTE), y además su modelo
  // permite varios comentarios por usuario. El control de duplicados es suyo.
  if (isApiEnabled("reviews")) return null;

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

  if (isApiEnabled("reviews")) {
    try {
      // Un gesto del usuario, dos entidades del backend: la calificación es
      // idempotente (repetirla actualiza) y el comentario entra a moderación.
      await apiPut(`/poi/${poiId}/my-rating`, { calificacion: score });
      const creado = await apiPost(`/poi/${poiId}/comments`, { contenido: body });
      return {
        ok: true,
        review: { ...adaptComentario(creado, user.id), rating: score },
        pendingModeration: creado.estado === "PENDIENTE",
      };
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión para comentar." };
      }
      const detalle = typeof error.detail === "string" ? error.detail : null;
      return { ok: false, error: detalle ?? "No pudimos publicar tu comentario. Inténtalo de nuevo." };
    }
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

  if (isApiEnabled("reviews")) {
    try {
      await apiDelete(`/comments/${reviewId}`);
      return { ok: true };
    } catch (error) {
      const detalle = typeof error.detail === "string" ? error.detail : null;
      return { ok: false, error: detalle ?? "No pudimos borrar el comentario." };
    }
  }

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
