import { getPoiById } from "../services/poi.service.js";
import { getPoiReviews, addPoiReview } from "../services/review.service.js";
import { isFavorite, toggleFavorite } from "../services/favorite.service.js";
import { hasVisited, registerVisit } from "../services/visit.service.js";
import { poiGallery, initPoiGallery } from "../components/molecules/poiGallery.js";
import { addressCard, scheduleCard } from "../components/molecules/infoCard.js";
import { poiSidebar } from "../components/organism/poiSidebar.js";
import { reviewsList } from "../components/organism/reviewsList.js";
import { isAuthenticated } from "../router/guards.js";
import { navigate } from "../router/router.js";
import { loadIcons } from "../utils/icons.js";
import "/src/styles/pages/poiDetail.css";
let detailMapInstance = null;
let currentPoi = null;
let currentReviews = [];
let currentReviewPage = 1;
const REVIEWS_PER_PAGE = 5;
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10; // one decimal
}

function renderRatingStars(avg) {
  const full = Math.floor(avg);
  const empty = 5 - full;
  let stars = '';
  for (let i = 0; i < full; i++) {
    stars += `<i data-lucide="star" class="review-star review-star--filled"></i>`;
  }
  for (let i = 0; i < empty; i++) {
    stars += `<i data-lucide="star" class="review-star"></i>`;
  }
  return stars;
}

function renderHeaderRating() {
  const starsContainer = document.getElementById('header-rating-stars');
  const valueContainer = document.getElementById('header-rating-value');
  if (!starsContainer || !valueContainer) return;
  const avg = calculateAverageRating(currentReviews);
  if (avg === null) {
    starsContainer.innerHTML = `<i data-lucide="star"></i>`;
    valueContainer.textContent = 'Sin reseñas';
  } else {
    starsContainer.innerHTML = renderRatingStars(avg);
    valueContainer.textContent = avg.toFixed(1);
  }
}

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
    <section class="poi-detail-page">
      ${poiGallery({ images, name: poi.name })}
      <div class="poi-detail-layout">
        <div class="poi-detail-main">
          <div class="poi-detail-meta">
            <span class="category poi-detail-category ${categoryClass}">${poi.category}</span>
            <div class="poi-detail-rating">
              <span id="header-rating-stars"></span>
              <span class="poi-detail-rating-value" id="header-rating-value"></span>
              <span class="poi-detail-review-count" id="header-review-count">(${formatReviewCount(reviews.length)} reseñas)</span>
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
                href="/map?id=${poi.id}"
                data-link
                class="btn btn--secondary poi-detail-map-link"
              >
                <i data-lucide="MapPin"></i>
                <span>Abrir mapa</span>
              </a>
            </div>
            <div id="poi-detail-map" class="poi-detail-map"></div>
          </section>
          ${reviewsList({ reviews, totalCount: poi.reviewCount || reviews.length })}
        </div>
        ${poiSidebar({ isFavorite: favorite, hasVisited: visited })}
      </div>
    </section>
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
      const nowFavorite = await toggleFavorite(poi.id);
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
function bindReviewForm(poi) {
  const form = document.getElementById("poi-review-form");
  if (!form) return;
  const ratingInput = document.getElementById("rating-input");
  const ratingHidden = document.getElementById("review-rating");
  const stars = ratingInput.querySelectorAll(".star-icon");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      const value = parseInt(star.getAttribute("data-value"), 10);
      ratingHidden.value = value;
      stars.forEach(s => {
        if (parseInt(s.getAttribute("data-value"), 10) <= value) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rating = ratingHidden.value;
    const text = document.getElementById("review-text").value.trim();
    if (!rating) {
      alert("Por favor selecciona una calificación.");
      return;
    }
    if (!text) {
      alert("Por favor escribe un comentario.");
      return;
    }
    const reviewData = {
      author: "Usuario Autenticado",
      initials: "UA",
      rating: Number(rating),
      text
    };
    const result = await addPoiReview(poi.id, reviewData);
    if (result.success) {
      alert(result.message);
      form.reset();
      ratingHidden.value = "";
      stars.forEach(s => s.classList.remove("active"));
      
      currentReviews.unshift(result.review);
      const countHeader = document.getElementById("reviews-count-header");
      if (countHeader) countHeader.textContent = currentReviews.length;
      const headerCount = document.getElementById("header-review-count");
      if (headerCount) headerCount.textContent = `(${formatReviewCount(currentReviews.length)} reseñas)`;
      renderHeaderRating();
      renderCurrentReviewsPage(1);
    }
  });
}
function renderCurrentReviewsPage(page) {
  currentReviewPage = page;
  const listContainer = document.getElementById("reviews-list-container");
  const paginationContainer = document.getElementById("reviews-pagination-container");
  
  import("../components/organism/reviewsList.js").then(({ renderReviewsPageHTML, renderPaginationHTML }) => {
    if (listContainer) {
      listContainer.innerHTML = renderReviewsPageHTML(currentReviews, currentReviewPage, REVIEWS_PER_PAGE);
    }
    if (paginationContainer) {
      paginationContainer.innerHTML = renderPaginationHTML(currentReviews.length, currentReviewPage, REVIEWS_PER_PAGE);
    }
    
    bindPagination();
    loadIcons();
  });
}
function bindPagination() {
  const paginationContainer = document.getElementById("reviews-pagination-container");
  if (!paginationContainer) return;
  const buttons = paginationContainer.querySelectorAll(".pagination-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled") || btn.classList.contains("active")) return;
      const targetPage = Number(btn.getAttribute("data-page"));
      renderCurrentReviewsPage(targetPage);
      
      const section = document.getElementById("reviews-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
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
    <div class="poi-detail">
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
    currentReviews = reviews;
    currentReviewPage = 1;
    const images = [...(poi.images || [poi.image])];
    root.parentElement.innerHTML = buildDetailHTML(poi, reviews, favorite, visited);
    renderHeaderRating();
    loadIcons();
    initPoiGallery(images);
    initDetailMap(poi);
    bindSidebarActions(poi);
    bindReviewForm(poi);
    bindPagination();
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) {
    console.error("Error al cargar el detalle del POI:", error);
    root.innerHTML = `
      <div class="poi-detail-error">
        <p>Hubo un error al cargar este lugar. Por favor, intenta de nuevo.</p>
        <a href="/explore" data-link class="btn btn--primary">Volver a Explorar</a>
      </div>
    `;
    // after building the detail page, update rating header
    loadIcons();
  }
}