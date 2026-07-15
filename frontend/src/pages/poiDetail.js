import { getPoiById } from "../services/poi.service.js";
import { getPoiReviews } from "../services/review.service.js";
import { isFavorite, toggleFavorite } from "../services/favorite.service.js";
import { hasVisited, registerVisit } from "../services/visit.service.js";
import { poiGallery, initPoiGallery } from "../components/molecules/poiGallery.js";
import { addressCard, scheduleCard } from "../components/molecules/infoCard.js";
import { poiSidebar } from "../components/organism/poiSidebar.js";
import { reviewsList } from "../components/organism/reviewsList.js";
import { isAuthenticated } from "../services/auth.service.js";
import { navigate } from "../router/router.js";
import { goBackOr } from "../utils/navigation.js";
import { loadIcons } from "../utils/icons.js";
import "/src/styles/pages/poiDetail.css";

let detailMapInstance = null;
let currentPoi = null;

function getCategoryClass(category) {
  return category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatReviewCount(count) {
  return count.toLocaleString("es-ES");
}

function buildDetailHTML(poi, reviews, favorite, visited) {
  const images = poi.images || [poi.image];
  const categoryClass = getCategoryClass(poi.category);

  return `
    <div class="poi-detail-page">
      <!-- El botón flota sobre la galería para no empujar la portada hacia
           abajo. El contenedor existe solo para anclarlo: la galería tiene
           overflow:hidden y lo recortaría si viviera dentro. -->
      <div class="poi-detail-hero">
        <button type="button" class="poi-detail-back" id="poi-detail-back">
          <i data-lucide="arrow-left" aria-hidden="true"></i>
          <span>Volver</span>
        </button>
        ${poiGallery({ images, name: poi.name })}
      </div>

      <div class="poi-detail-layout">
        <div class="poi-detail-main">
          <div class="poi-detail-meta">
            <span class="category poi-detail-category ${categoryClass}">${poi.category}</span>
            <div class="poi-detail-rating">
              <i data-lucide="star"></i>
              <span class="poi-detail-rating-value">${poi.rating.toFixed(1)}</span>
              <span class="poi-detail-review-count">(${formatReviewCount(poi.reviewCount || 0)} reseñas)</span>
            </div>
          </div>

          <h1 class="poi-detail-title">${poi.name}</h1>

          <section class="poi-detail-about">
            <h2>Acerca de este lugar</h2>
            <p>${poi.description}</p>
          </section>

          <div class="poi-detail-info-cards">
            ${addressCard({ address: poi.address })}
            ${scheduleCard({ schedule: poi.schedule })}
          </div>

          <section class="poi-detail-map-section">
            <div class="poi-detail-map-header">
              <h2>Mapa</h2>
              <a
                href="https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn--secondary poi-detail-map-link"
              >
                <i data-lucide="external-link"></i>
                <span>Abrir en Mapas</span>
              </a>
            </div>
            <div id="poi-detail-map" class="poi-detail-map"></div>
          </section>

          ${reviewsList({ reviews, totalCount: poi.reviewCount || reviews.length })}
        </div>

        ${poiSidebar({ isFavorite: favorite, hasVisited: visited })}
      </div>
    </div>
  `;
}

function initDetailMap(poi) {
  const mapContainer = document.getElementById("poi-detail-map");
  if (!mapContainer || typeof L === "undefined") return;

  if (detailMapInstance) {
    try {
      detailMapInstance.remove();
    } catch {
      /* ignore */
    }
    detailMapInstance = null;
  }

  detailMapInstance = L.map("poi-detail-map", { zoomControl: false })
    .setView([poi.lat, poi.lng], 15);

  L.control.zoom({ position: "topright" }).addTo(detailMapInstance);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(detailMapInstance);

  const categoryClass = getCategoryClass(poi.category);
  const markerIcon = L.divIcon({
    className: "poi-detail-marker-wrapper",
    html: `<div class="poi-detail-marker ${categoryClass}"><i data-lucide="map-pin"></i></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

  L.marker([poi.lat, poi.lng], { icon: markerIcon })
    .addTo(detailMapInstance)
    .bindPopup(`<b>${poi.name}</b><br>${poi.address}`);

  setTimeout(() => {
    if (detailMapInstance) detailMapInstance.invalidateSize();
  }, 150);

  loadIcons();
}

function bindBackButton() {
  document.getElementById("poi-detail-back")?.addEventListener("click", () => {
    // Explora es el respaldo natural: es de donde se llega a un POI.
    goBackOr("/explore");
  });
}

function bindSidebarActions(poi) {
  const visitBtn = document.getElementById("btn-register-visit");
  const favoriteBtn = document.getElementById("btn-add-favorite");
  const reviewsSeeAll = document.getElementById("reviews-see-all");

  if (visitBtn && !visitBtn.disabled) {
    visitBtn.addEventListener("click", async () => {
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }

      visitBtn.disabled = true;
      visitBtn.querySelector("span").textContent = "Registrando...";

      const coords = await getUserCoords();
      const result = await registerVisit(poi.id, coords);

      if (result.success) {
        visitBtn.querySelector("span").textContent = "Visita Registrada";
        alert(result.message);
      } else {
        visitBtn.disabled = false;
        visitBtn.querySelector("span").textContent = "Registrar Visita";
        alert(result.message);
      }
    });
  }

  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", async () => {
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }

      const { isFavorite: nowFavorite } = await toggleFavorite(poi.id);
      const label = favoriteBtn.querySelector("span");

      if (nowFavorite) {
        favoriteBtn.classList.add("poi-sidebar-fav--active");
        label.textContent = "Quitar de Favoritos";
      } else {
        favoriteBtn.classList.remove("poi-sidebar-fav--active");
        label.textContent = "Agregar a Favoritos";
      }

      loadIcons();
    });
  }

  if (reviewsSeeAll) {
    reviewsSeeAll.addEventListener("click", () => {
      alert(`Mostrando las ${poi.reviewCount || 0} reseñas. Se conectará al backend para paginación completa.`);
    });
  }
}

function getUserCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 0, lng: 0 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: 0, lng: 0 }),
      { timeout: 4000, maximumAge: 60000 }
    );
  });
}

export function poiDetail() {
  return `
    <div class="poi-detail-page">
      <div id="poi-detail-root" class="poi-detail-loading">
        <p>Cargando punto de interés...</p>
      </div>
    </div>
  `;
}

export async function initPoiDetail({ id } = {}) {
  const root = document.getElementById("poi-detail-root");
  if (!root) return;

  if (!id) {
    root.innerHTML = `<div class="poi-detail-error"><p>Punto de interés no encontrado.</p></div>`;
    return;
  }

  try {
    const [poi, reviews, favorite, visited] = await Promise.all([
      getPoiById(id),
      getPoiReviews(id),
      isFavorite(id),
      hasVisited(id),
    ]);

    if (!poi) {
      root.innerHTML = `
        <div class="poi-detail-error">
          <p>No encontramos este punto de interés.</p>
          <a href="/explore" data-link class="btn btn--primary">Volver a Explorar</a>
        </div>
      `;
      loadIcons();
      return;
    }

    currentPoi = poi;
    const images = [...(poi.images || [poi.image])];

    root.parentElement.innerHTML = buildDetailHTML(poi, reviews, favorite, visited);
    loadIcons();

    initPoiGallery(images);
    initDetailMap(poi);
    bindBackButton();
    bindSidebarActions(poi);

    window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) {
    console.error("Error al cargar el detalle del POI:", error);
    root.innerHTML = `
      <div class="poi-detail-error">
        <p>Hubo un error al cargar este lugar. Por favor, intenta de nuevo.</p>
        <a href="/explore" data-link class="btn btn--primary">Volver a Explorar</a>
      </div>
    `;
    loadIcons();
  }
}
