import { escapeHtml } from "../organism/modal.js";
import { formatRelativeDate } from "../../utils/date.js";
import "/src/styles/molecules/reviewCard.css";

// Tarjeta de reseña.
//
// El texto y el autor los escribe el usuario desde el formulario del detalle,
// así que se escapan: sin esto, un comentario con HTML se ejecutaría en la
// página de todo el que lo lea.

/**
 * @param {Object} review - Reseña a pintar.
 * @param {string} review.author - Nombre de quien la escribe.
 * @param {string} review.initials - Iniciales para el avatar.
 * @param {number} review.rating - Valoración de 1 a 5.
 * @param {string} review.text - Cuerpo del comentario.
 * @param {string} review.createdAt - Instante de publicación en ISO 8601.
 * @param {boolean} [review.isMine] - Si la escribió el usuario con sesión.
 * @returns {string} HTML de la tarjeta.
 */
export function reviewCard({ author, initials, rating, text, createdAt, isMine = false }) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));

  // Contra el backend la calificación es una entidad aparte y el comentario
  // llega sin estrellas: en ese caso la fila de valoración no se pinta, en
  // vez de mentir con cinco estrellas vacías.
  const stars = score === 0
    ? ""
    : Array.from({ length: 5 }, (_, i) =>
        i < score
          ? `<i data-lucide="star" class="review-star review-star--filled"></i>`
          : `<i data-lucide="star" class="review-star"></i>`
      ).join("");

  return `
    <article class="review-card${isMine ? " review-card--mine" : ""}">
      <div class="review-card-header">
        <div class="review-avatar">${escapeHtml(initials)}</div>
        <div class="review-author-info">
          <h4 class="review-author">
            ${escapeHtml(author)}
            ${isMine ? `<span class="review-badge-mine">Tu comentario</span>` : ""}
          </h4>
          <span class="review-date">${escapeHtml(formatRelativeDate(createdAt))}</span>
        </div>
      </div>
      ${stars ? `<div class="review-rating" aria-label="Valoración: ${score} de 5">${stars}</div>` : ""}
      <p class="review-text">${escapeHtml(text)}</p>
    </article>
  `;
}
