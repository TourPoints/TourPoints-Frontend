import "/src/styles/organism/challengeGrid.css";
import { challengeCard } from "../molecules/challengeCard.js";

export function challengeGrid(challengeList = []) {
  // Caso de seguridad por si no hay retos cargados
  if (challengeList.length === 0) {
    return `
      <div class="challenge-empty">
        <p>No hay retos disponibles para completar en este momento. ¡Vuelve más tarde!</p>
      </div>
    `;
  }

  return `
    <div class="challenge-grid">
      ${challengeList.map(challenge => challengeCard(challenge)).join('')}
    </div>
  `;
}