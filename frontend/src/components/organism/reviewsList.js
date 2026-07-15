import { reviewCard } from "../molecules/reviewCard.js";
import { escapeHtml } from "./modal.js";
import { REVIEW_MAX_LENGTH } from "../../services/review.service.js";
import "/src/styles/organism/reviewsList.css";

// Sección de comentarios del detalle de POI.
//
// Es presentacional: recibe el estado ya resuelto y devuelve HTML. Quien
// orquesta los servicios es la página, igual que hace challenges.js.
//
// Antes mostraba tres reseñas fijas y un "Ver todos" que solo lanzaba un
// alert. Ahora la lista se despliega de verdad y se puede comentar.

const PREVIEW_COUNT = 3;

/**
 * @param {Object} config
 * @param {Array<Object>} config.reviews - Reseñas ya ordenadas.
 * @param {boolean} config.isLoggedIn - Si hay sesión abierta.
 * @param {boolean} config.hasReviewed - Si el usuario ya comentó este POI.
 * @param {boolean} [config.expanded] - Si se muestran todas las reseñas.
 * @param {string} [config.error] - Mensaje de error del último envío.
 * @returns {string} HTML de la sección.
 */
export function reviewsList({
  reviews = [],
  isLoggedIn = false,
  hasReviewed = false,
  expanded = false,
  error = "",
}) {
  const visible = expanded ? reviews : reviews.slice(0, PREVIEW_COUNT);
  const remaining = reviews.length - visible.length;

  const listHtml =
    reviews.length > 0
      ? visible.map((review) => reviewCard(review)).join("")
      : `<p class="reviews-empty">Aún no hay comentarios para este lugar. ¡Sé el primero!</p>`;

  const toggle =
    remaining > 0
      ? `<button type="button" class="reviews-see-all" id="reviews-see-all">
           Ver ${remaining} ${remaining === 1 ? "comentario más" : "comentarios más"}
         </button>`
      : expanded && reviews.length > PREVIEW_COUNT
        ? `<button type="button" class="reviews-see-all" id="reviews-see-all">Ver menos</button>`
        : "";

  return `
    <section class="reviews-section" id="reviews-section">
      <div class="reviews-header">
        <h2>Comentarios</h2>
        <span class="reviews-count">${reviews.length}</span>
      </div>

      ${reviewForm({ isLoggedIn, hasReviewed, error })}

      <div class="reviews-list">
        ${listHtml}
      </div>

      ${toggle}
    </section>
  `;
}

/**
 * Formulario de comentario, o el aviso que corresponda a cada situación.
 */
function reviewForm({ isLoggedIn, hasReviewed, error }) {
  if (!isLoggedIn) {
    return `
      <div class="review-form-notice">
        <p>Inicia sesión para compartir tu experiencia en este lugar.</p>
        <a href="/login" class="btn btn--primary" data-link>Iniciar sesión</a>
      </div>
    `;
  }

  if (hasReviewed) {
    return `
      <div class="review-form-notice review-form-notice--done">
        <p>Ya has comentado este lugar. ¡Gracias por aportar!</p>
      </div>
    `;
  }

  // Las estrellas van en orden inverso en el marcado para que el selector
  // "input:checked ~ label" pueda pintar las anteriores: CSS solo alcanza a
  // los hermanos posteriores, así que la fila se invierte con row-reverse.
  const stars = [5, 4, 3, 2, 1]
    .map(
      (value) => `
      <input type="radio" name="review-rating" id="review-star-${value}" value="${value}"
             class="review-star-input" required>
      <label for="review-star-${value}" class="review-star-label"
             title="${value} ${value === 1 ? "estrella" : "estrellas"}">
        <i data-lucide="star" aria-hidden="true"></i>
        <span class="sr-only">${value} ${value === 1 ? "estrella" : "estrellas"}</span>
      </label>
    `
    )
    .join("");

  return `
    <form class="review-form" id="review-form" novalidate>
      <fieldset class="review-form-rating">
        <legend>Tu valoración</legend>
        <div class="review-stars-input">${stars}</div>
      </fieldset>

      <label class="sr-only" for="review-text">Tu comentario</label>
      <textarea
        id="review-text"
        class="review-form-text"
        rows="3"
        maxlength="${REVIEW_MAX_LENGTH}"
        placeholder="¿Qué te pareció este lugar? Cuenta lo que otro visitante agradecería saber."
      ></textarea>

      <div class="review-form-footer">
        <span class="review-form-counter" id="review-counter">0 / ${REVIEW_MAX_LENGTH}</span>
        <button type="submit" class="btn btn--primary review-form-submit">Publicar comentario</button>
      </div>

      <p class="review-form-error" id="review-error" role="alert" ${error ? "" : "hidden"}>${escapeHtml(error)}</p>
    </form>
  `;
}
