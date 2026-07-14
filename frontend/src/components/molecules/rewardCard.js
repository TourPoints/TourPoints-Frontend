import "/src/styles/molecules/rewardCard.css";

export function rewardCard({ id, name, description, image, points, isClaimed = false }) {
  return `
    <article class="reward-card" data-id="${id}">
      <div class="reward-card-img-container">
        <img src="${image}" alt="${name}" class="reward-card-img" loading="lazy">
        <span class="reward-card-points">${points.toLocaleString()} PTS</span>
        ${isClaimed ? '<span class="reward-card-claimed-badge">RECLAMADO</span>' : ""}
      </div>
      <div class="reward-card-content">
        <h3 class="reward-card-title">${name}</h3>
        <p class="reward-card-description">${description}</p>
        <button class="reward-card-btn ${isClaimed ? "reward-card-btn--claimed" : "reward-card-btn--available"}" ${isClaimed ? "disabled" : ""} data-reward-id="${id}">
          ${isClaimed ? "Reclamado" : "Canjear"}
        </button>
      </div>
    </article>
  `;
}
