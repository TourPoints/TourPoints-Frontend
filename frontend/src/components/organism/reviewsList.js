import { reviewCard } from "../molecules/reviewCard.js";
import { isAuthenticated } from "../../router/guards.js";

export function renderReviewsPageHTML(reviews, page = 1, pageSize = 5) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayReviews = reviews.slice(start, end);

  if (displayReviews.length === 0) {
    return `<p class="reviews-empty" id="reviews-empty-message">Aún no hay comentarios para este lugar.</p>`;
  }

  return displayReviews.map((r) => reviewCard(r)).join("");
}

export function renderPaginationHTML(totalItems, currentPage = 1, pageSize = 5) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return "";

  let buttons = "";
  
  buttons += `<button class="pagination-btn pagination-prev ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&lt; Anterior</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    buttons += `<button class="pagination-btn pagination-num ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  
  buttons += `<button class="pagination-btn pagination-next ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente &gt;</button>`;

  return `<div class="reviews-pagination">${buttons}</div>`;
}

export function reviewsList({ reviews = [], totalCount = 0 }) {
  const pageSize = 5;
  const initialPage = 1;
  const reviewsHtml = renderReviewsPageHTML(reviews, initialPage, pageSize);
  const paginationHtml = renderPaginationHTML(reviews.length, initialPage, pageSize);

  let reviewFormHtml = "";

  if (isAuthenticated()) {
    reviewFormHtml = `
      <div class="review-form-container">
        <h3>Escribe un comentario</h3>
        <form id="poi-review-form" class="review-form">
          <div class="form-group">
            <label>Calificación</label>
            <div class="rating-input" id="rating-input">
              <i data-lucide="star" data-value="1" class="star-icon"></i>
              <i data-lucide="star" data-value="2" class="star-icon"></i>
              <i data-lucide="star" data-value="3" class="star-icon"></i>
              <i data-lucide="star" data-value="4" class="star-icon"></i>
              <i data-lucide="star" data-value="5" class="star-icon"></i>
            </div>
            <input type="hidden" id="review-rating" name="rating" value="">
          </div>
          <div class="form-group">
            <label for="review-text">Comentario</label>
            <textarea id="review-text" name="text" rows="4" placeholder="Comparte tu experiencia..."></textarea>
          </div>
          <button type="submit" class="btn btn--primary">Publicar comentario</button>
        </form>
      </div>
    `;
  } else {
    reviewFormHtml = `
      <div class="review-form-login-prompt">
        <p>Debes iniciar sesión para escribir un comentario.</p>
        <a href="/login" data-link class="btn btn--secondary">Iniciar sesión</a>
      </div>
    `;
  }

  return `
    <section class="reviews-section" id="reviews-section">
      <div class="reviews-header">
        <h2>Comentarios (<span id="reviews-count-header">${reviews.length}</span>)</h2>
      </div>
      <div class="reviews-list" id="reviews-list-container">
        ${reviewsHtml}
      </div>
      <div id="reviews-pagination-container">
        ${paginationHtml}
      </div>
      ${reviewFormHtml}
    </section>
  `;
}
