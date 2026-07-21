import { buttonLinks } from "../atoms/buttonLinks";
import { t } from "../../i18n/index.js";
import "/src/styles/molecules/challengeCard.css";

// Tarjeta de reto (US TOUR-35).
//
// Dos modos:
// - Sin `state`: variante simple que usa el home (enlace "Ver detalle").
// - Con `state` (disponible | en-curso | completado): variante de la página
//   de retos, con botón real que la vista engancha para abrir el detalle.
//   "en-curso" se resalta en azul y "completado" se apaga con su insignia,
//   como en el diseño de Figma.

export function challengeCard({ id, name, description, image, points, state }) {
  if (state === undefined) {
    return `
    <article class="challenge-card" data-id="${id}">
      <div class="challenge-card-img-container">
        <img src="${image}" alt="${name}" class="challenge-card-img" loading="lazy">
        <span class="challenge-card-points"> ${t("cards.pointsBadge", { points })}</span>
      </div>
      <div class="challenge-card-content">
        <h3 class="challenge-card-title">${name}</h3>
        <p class="challenge-card-description">${description} </p>
        <div class="challenge-button">
        ${buttonLinks("/challenges", t("cards.viewDetail"), "secondary")}
        </div>
      </div>
    </article>
  `;
  }

  const isCompleted = state === "completado";
  const isActive = state === "en-curso";
  const stateClass = isCompleted
    ? "challenge-card--completed"
    : isActive
      ? "challenge-card--active"
      : "";

  return `
    <article class="challenge-card ${stateClass}" data-id="${id}">
      <div class="challenge-card-img-container">
        <img src="${image}" alt="${name}" class="challenge-card-img" loading="lazy">
        ${
          isCompleted
            ? `<span class="challenge-card-completed-badge"><i data-lucide="check" aria-hidden="true"></i> ${t("cards.completedBadge")}</span>`
            : `<span class="challenge-card-points">${t("cards.ptsBadge", { points })}</span>`
        }
      </div>
      <div class="challenge-card-content">
        <h3 class="challenge-card-title">${name}</h3>
        <p class="challenge-card-description">${description}</p>
        <div class="challenge-button">
          <button
            type="button"
            class="challenge-card-btn ${isCompleted ? "challenge-card-btn--done" : ""}"
            data-challenge-id="${id}"
            ${isCompleted ? "disabled" : ""}
          >
            ${isCompleted ? t("cards.challengeDone") : t("cards.viewDetail")}
          </button>
        </div>
      </div>
    </article>
  `;
}
