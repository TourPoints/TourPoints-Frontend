import { t } from "../../i18n/index.js";
import "/src/styles/molecules/rewardCard.css";

// El modelo real de recompensa (services/reward.service.js) no tiene un
// "isClaimed" por usuario -- eso requeriría un backend con canjes por
// cuenta, que todavía no existe. Lo que sí sabemos es el stock real, así
// que la tarjeta se deshabilita cuando se agota en vez de fingir un estado
// de "reclamado" que nadie está calculando.
export function rewardCard({ id, name, description = "", image, emoji = "🎁", points, stock }) {
  const soldOut = Number(stock) <= 0;

  return `
    <article class="reward-card" data-id="${id}">
      <div class="reward-card-img-container">
        ${
          image
            ? `<img src="${image}" alt="${name}" class="reward-card-img" loading="lazy">`
            : `<div class="reward-card-img reward-card-img--emoji">${emoji}</div>`
        }
        <span class="reward-card-points">${Number(points).toLocaleString()} PTS</span>
        ${soldOut ? `<span class="reward-card-claimed-badge">${t("cards.soldOut")}</span>` : ""}
      </div>
      <div class="reward-card-content">
        <h3 class="reward-card-title">${name}</h3>
        <p class="reward-card-description">${description}</p>
        <button class="reward-card-btn ${soldOut ? "reward-card-btn--claimed" : "reward-card-btn--available"}" ${soldOut ? "disabled" : ""} data-reward-id="${id}">
          ${soldOut ? t("cards.noStock") : t("cards.redeem")}
        </button>
      </div>
    </article>
  `;
}
