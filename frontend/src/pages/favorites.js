// Página de favoritos del usuario.
//
// El corazón de las tarjetas y del detalle ya guardaba POIs, pero no había
// ningún sitio donde verlos: se guardaban y desaparecían. Esta vista los lista.
//
// Los favoritos son del usuario con sesión, así que sin sesión no hay nada que
// mostrar y se invita a entrar en vez de fingir una lista vacía.

import { getPois } from "../services/poi.service.js";
import { getMyFavoriteEntries } from "../services/favorite.service.js";
import { getCurrentUser } from "../services/auth.service.js";
import { poiCard, initFavoriteButtons } from "../components/molecules/poisCard.js";
import { loadIcons } from "../utils/icons.js";
import { t } from "../i18n/index.js";
import "/src/styles/pages/favorites.css";

let favoritePois = [];

export function favorites() {
  return `
    <section class="favorites-page">
      <div class="favorites-header">
        <h1>${t("favorites.title")}</h1>
        <p id="favorites-subtitle">${t("favorites.subtitle")}</p>
      </div>

      <div class="favorites-grid" id="favorites-grid">
        <p class="favorites-loading">${t("favorites.loading")}</p>
      </div>
    </section>
  `;
}

export async function initFavorites() {
  const container = document.getElementById("favorites-grid");
  if (!container) return;

  if (!getCurrentUser()) {
    renderSignedOut(container);
    return;
  }

  let pois = [];
  try {
    pois = await getPois();
  } catch (error) {
    console.error("Error al cargar los favoritos:", error);
    container.innerHTML = `
      <div class="favorites-empty">
        <p>${t("favorites.error")}</p>
      </div>
    `;
    return;
  }

  // Las entradas llegan de la más reciente a la más antigua; se cruzan con el
  // catálogo en ese orden para que lo último guardado encabece la lista.
  // Un POI puede haber dejado de publicarse desde que se guardó: en ese caso
  // no aparece, en vez de pintar una tarjeta rota.
  const byId = new Map(pois.map((poi) => [String(poi.id), poi]));
  favoritePois = (await getMyFavoriteEntries())
    .map((entry) => byId.get(String(entry.poiId)))
    .filter(Boolean);

  render();
}

function render() {
  const container = document.getElementById("favorites-grid");
  const subtitle = document.getElementById("favorites-subtitle");
  if (!container) return;

  if (subtitle) {
    subtitle.textContent =
      favoritePois.length === 0
        ? t("favorites.subtitle")
        : t("favorites.savedCount", { count: favoritePois.length });
  }

  if (favoritePois.length === 0) {
    container.innerHTML = `
      <div class="favorites-empty">
        <i class="favorites-empty-icon" data-lucide="heart" aria-hidden="true"></i>
        <p>${t("favorites.emptyTitle")}</p>
        <span class="favorites-empty-hint">${t("favorites.emptyHint")}</span>
        <a href="/explore" class="btn btn--primary" data-link>${t("favorites.exploreCta")}</a>
      </div>
    `;
    loadIcons();
    return;
  }

  container.innerHTML = favoritePois
    .map((poi) => poiCard({ ...poi, isFeatured: false, isFavorite: true }))
    .join("");

  // Al quitar un favorito desde esta misma lista la tarjeta sobra: se elimina
  // del estado y se repinta, en vez de dejar una tarjeta con el corazón vacío.
  initFavoriteButtons(container, (poiId, isFavorite) => {
    if (isFavorite) return;
    favoritePois = favoritePois.filter((poi) => String(poi.id) !== String(poiId));
    render();
  });

  loadIcons();
}

function renderSignedOut(container) {
  const subtitle = document.getElementById("favorites-subtitle");
  if (subtitle) {
    subtitle.textContent = t("favorites.signedOutSubtitle");
  }

  container.innerHTML = `
    <div class="favorites-empty">
      <i class="favorites-empty-icon" data-lucide="lock" aria-hidden="true"></i>
      <p>${t("favorites.signedOutTitle")}</p>
      <a href="/login" class="btn btn--primary" data-link>${t("favorites.loginCta")}</a>
    </div>
  `;
  loadIcons();
}
