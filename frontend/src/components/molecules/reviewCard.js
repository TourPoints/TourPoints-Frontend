import "/src/styles/molecules/reviewCard.css";

export function reviewCard({ author, initials, rating, text, date }) {
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < rating
      ? `<i data-lucide="star" class="review-star review-star--filled"></i>`
      : `<i data-lucide="star" class="review-star"></i>`
  ).join("");

  return `
    <article class="review-card">
      <div class="review-card-header">
        <div class="review-avatar">${initials}</div>
        <div class="review-author-info">
          <h4 class="review-author">${author}</h4>
          <span class="review-date">${date}</span>
        </div>
      </div>
      <div class="review-rating">${stars}</div>
      <p class="review-text">${text}</p>
    </article>
  `;
}
