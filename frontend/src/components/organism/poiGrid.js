import "/src/styles/organism/poiGrid.css";
import { poiCard } from "../molecules/poisCard.js";
import { getMyFavoriteIds } from "../../services/favorite.service.js";

export function poiGrid(poiList = []) {
  if (poiList.length === 0) {
    return `<p class="u-text-center">No hay puntos de interés destacados disponibles en este momento.</p>`;
  }

  // 🌟 LOGICA DINÁMICA: Ordenamos de mayor a menor calificación (rating)
  const sortedPois = [...poiList].sort((a, b) => b.rating - a.rating);

  const favorites = getMyFavoriteIds();

  // Renderizamos transformando el primer elemento en destacado
  return `
    <div class="o-poi-grid">
      ${sortedPois
        .map((poi, index) => {
          return poiCard({
            ...poi,
            isFeatured: index === 0, // Solo el primero (índice 0) será la tarjeta grande
            isFavorite: favorites.has(String(poi.id)),
          });
        })
        .join("")}
    </div>
  `;
}
