import { escapeHtml } from "../organism/modal.js";
import { isAuthenticated } from "../../services/auth.service.js";
import { toggleFavorite } from "../../services/favorite.service.js";
import { navigate } from "../../router/router.js";
import { loadIcons } from "../../utils/icons.js";
import "/src/styles/molecules/poiCard.css";

// Tarjeta de Punto de Interés.
//
// El corazón existía en el marcado desde el principio pero no tenía ningún
// manejador: era un botón decorativo. Ahora guarda el POI de verdad, y el
// estado inicial llega en la prop isFavorite para que la tarjeta se pinte ya
// marcada si el usuario la tenía guardada.

/**
 * @param {Object} poi - Datos del POI.
 * @param {boolean} [poi.isFeatured] - Si es la tarjeta grande destacada.
 * @param {boolean} [poi.isFavorite] - Si el usuario lo tiene guardado.
 * @returns {string} HTML de la tarjeta.
 */
export function poiCard({
  id,
  name,
  category,
  image,
  rating,
  points,
  description = "",
  isFeatured = false,
  isFavorite = false,
}) {
  const cardClass = isFeatured ? "poi-card poi-card-featured" : "poi-card";
  const favClass = isFavorite ? " btn-heart--active" : "";
  const favLabel = isFavorite ? "Quitar de favoritos" : "Guardar en favoritos";

  return `
    <article class="${cardClass}" data-id="${escapeHtml(id)}">
      <div class="poi-card-img-container">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" class="poi-card-img" loading="lazy">
        <span class="poi-card-points"> +${escapeHtml(points)} puntos</span>
        <button
          type="button"
          class="btn-heart${favClass}"
          data-fav-id="${escapeHtml(id)}"
          aria-pressed="${isFavorite}"
          aria-label="${favLabel}"
        >
          <i data-lucide="heart"></i>
        </button>
        ${
          isFeatured
            ? `
          <div class="poi-card-featured-overlay">
            <span class="category">${escapeHtml(category)}</span>
            <h3 class="poi-card-title">${escapeHtml(name)}</h3>
          </div>
        `
            : ""
        }
      </div>

      ${
        !isFeatured
          ? `
        <div class="poi-card-content">
          <div class="pois-card-header-info">
            <span class="category">${escapeHtml(category)}</span>
            <div class="poi-card-rating">
              <i data-lucide="star"></i>
              <span>${(Number(rating) || 0).toFixed(1)}</span>
            </div>
          </div>
          <h3 class="poi-card-title">${escapeHtml(name)}</h3>
          <p class="pois-card-description">${escapeHtml(description)}</p>
          <a href="/poi/${escapeHtml(id)}" data-link class="btn btn--primary btn-card-more">Ver más</a>
        </div>
      `
          : ""
      }
    </article>
  `;
}

/**
 * Refleja el estado de guardado en un botón de corazón.
 * @param {HTMLElement} btn - El botón.
 * @param {boolean} isFavorite - Nuevo estado.
 */
function paintFavorite(btn, isFavorite) {
  btn.classList.toggle("btn-heart--active", isFavorite);
  btn.setAttribute("aria-pressed", String(isFavorite));
  btn.setAttribute("aria-label", isFavorite ? "Quitar de favoritos" : "Guardar en favoritos");
}

/**
 * Engancha los corazones de las tarjetas ya insertadas en el DOM.
 * La llaman las vistas que pintan tarjetas (inicio, explora, favoritos).
 * @param {ParentNode} [container=document] - Ámbito donde buscar los botones.
 * @param {Function} [onToggle] - Aviso opcional tras cambiar un favorito,
 *   para que la vista de favoritos pueda quitar la tarjeta de la lista.
 */
export function initFavoriteButtons(container = document, onToggle) {
  container.querySelectorAll("[data-fav-id]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      // El corazón vive dentro de la tarjeta: sin esto el clic seguiría
      // burbujeando hasta el enlace "Ver más" y navegaría al detalle.
      event.preventDefault();
      event.stopPropagation();

      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }

      const poiId = btn.dataset.favId;
      const { ok, isFavorite } = await toggleFavorite(poiId);
      if (!ok) return;

      paintFavorite(btn, isFavorite);
      loadIcons();
      onToggle?.(poiId, isFavorite);
    });
  });
}
