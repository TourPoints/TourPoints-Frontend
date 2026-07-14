import { reviewCard } from "../molecules/reviewCard.js";

export function reviewsList({ reviews = [], totalCount = 0 }) {
  const displayReviews = reviews.slice(0, 3);

  const reviewsHtml = displayReviews.length > 0
    ? displayReviews.map((r) => reviewCard(r)).join("")
    : `<p class="reviews-empty">Aún no hay comentarios para este lugar.</p>`;

  const seeAllLink = totalCount > 3
    ? `<button class="reviews-see-all" id="reviews-see-all">Ver todos</button>`
    : "";

  return `
    <section class="reviews-section">
      <div class="reviews-header">
        <h2>Comentarios</h2>
        ${seeAllLink}
      </div>
      <div class="reviews-list">
        ${reviewsHtml}
      </div>
    </section>
  `;
}
