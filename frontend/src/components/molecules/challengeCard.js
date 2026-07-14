import { buttonLinks } from "../atoms/buttonLinks";
import "/src/styles/molecules/challengeCard.css";



export function challengeCard({ id, name, description, image, points }) {
  return `
    <article class="challenge-card" data-id="${id}">
      <div class="challenge-card-img-container">
        <img src="${image}" alt="${name}" class="challenge-card-img" loading="lazy">
        <span class="challenge-card-points"> +${points} puntos</span>
      </div>  
      <div class="challenge-card-content">
      

        <h3 class="challenge-card-title">${name}</h3>
        
        <p class="challenge-card-description">${description} </p>
        <div class="challenge-button">
        ${buttonLinks("", "Ver detalle", "secondary")}
        </div>
      </div>
    </article>
  `;
}
