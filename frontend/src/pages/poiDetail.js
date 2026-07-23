import { getPoiById } from "../services/poi.service.js";
import {
  getPoiReviews,
  getMyReviewFor,
  createReview,
  REVIEW_MAX_LENGTH,
} from "../services/review.service.js";
import { isFavorite, toggleFavorite } from "../services/favorite.service.js";
import { hasVisited, registerVisit } from "../services/visit.service.js";
import { poiGallery, initPoiGallery } from "../components/molecules/poiGallery.js";
import { addressCard, scheduleCard } from "../components/molecules/infoCard.js";
import { poiSidebar } from "../components/organism/poiSidebar.js";
import { reviewsList } from "../components/organism/reviewsList.js";
import { openConfirmModal } from "../components/organism/modal.js";
import { isAuthenticated } from "../services/auth.service.js";
import { refreshSessionPoints } from "../services/points.service.js";
import { navigate } from "../router/router.js";
import { goBackOr } from "../utils/navigation.js";
import { loadIcons } from "../utils/icons.js";
import { formatRating } from "../utils/poiFilter.js";
import "/src/styles/pages/poiDetail.css";

let detailMapInstance = null;

// Estado de la sección de comentarios. Vive aquí porque la página es quien
// orquesta los servicios y repinta la sección, igual que en challenges.js.
let reviewsExpanded = false;

function getCategoryClass(category) {
  return category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatReviewCount(count) {
  return count.toLocaleString("es-ES");
}

function buildDetailHTML(poi, reviews, favorite, visited, myReview) {
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
              ${
                formatRating(poi.rating)
                  ? `<span class="poi-detail-rating-value">${formatRating(poi.rating)}</span>`
                  : ""
              }
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
                href="/map?poi=${poi.id}"
                data-link
                class="btn btn--secondary poi-detail-map-link"
              >
                <i data-lucide="route"></i>
                <span>Ver en el mapa</span>
              </a>
            </div>
            <div id="poi-detail-map" class="poi-detail-map"></div>
          </section>

          <div id="reviews-root">
            ${reviewsList({
              reviews,
              isLoggedIn: isAuthenticated(),
              hasReviewed: Boolean(myReview),
            })}
          </div>
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

// ── Comentarios ───────────────────────────────────────────────

/**
 * Repinta la sección de comentarios con el estado vigente y vuelve a
 * enganchar sus eventos. Se llama tras publicar o al desplegar la lista.
 * @param {Object} poi - POI en pantalla.
 * @param {string} [error] - Error del último intento de publicar.
 */
async function renderReviews(poi, error = "") {
  const root = document.getElementById("reviews-root");
  if (!root) return;

  const [reviews, myReview] = await Promise.all([
    getPoiReviews(poi.id),
    getMyReviewFor(poi.id),
  ]);

  root.innerHTML = reviewsList({
    reviews,
    isLoggedIn: isAuthenticated(),
    hasReviewed: Boolean(myReview),
    expanded: reviewsExpanded,
    error,
  });

  bindReviews(poi);
  loadIcons();
}

/**
 * Engancha el formulario y el desplegable de la sección de comentarios.
 * @param {Object} poi - POI en pantalla.
 */
function bindReviews(poi) {
  document.getElementById("reviews-see-all")?.addEventListener("click", () => {
    reviewsExpanded = !reviewsExpanded;
    renderReviews(poi);
  });

  const form = document.getElementById("review-form");
  if (!form) return;

  const textarea = document.getElementById("review-text");
  const counter = document.getElementById("review-counter");

  textarea?.addEventListener("input", () => {
    const { length } = textarea.value;
    if (counter) {
      counter.textContent = `${length} / ${REVIEW_MAX_LENGTH}`;
      counter.classList.toggle("review-form-counter--limit", length >= REVIEW_MAX_LENGTH);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const rating = form.querySelector("input[name=review-rating]:checked")?.value;
    const submit = form.querySelector(".review-form-submit");

    // Bloquear el botón evita el doble envío: la regla de una reseña por
    // usuario lo rechazaría, pero con un error confuso en vez de silencio.
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Publicando...";
    }

    const result = await createReview(poi.id, { rating, text: textarea?.value });

    if (!result.ok) {
      showReviewError(result.error);
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Publicar comentario";
      }
      return;
    }

    // El comentario recién publicado va el primero: si la lista estaba
    // plegada se ve igualmente, así que no hace falta desplegarla.
    // Contra el backend nace PENDIENTE y no aparecerá hasta que un admin lo
    // apruebe: sin este aviso, publicar parecería no haber hecho nada.
    await renderReviews(
      poi,
      result.pendingModeration
        ? "¡Gracias! Tu comentario quedó pendiente de moderación y aparecerá cuando se apruebe."
        : ""
    );
    document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

/**
 * Muestra un error de validación sin repintar el formulario, para no
 * perder lo que el usuario ya había escrito.
 * @param {string} message
 */
function showReviewError(message) {
  const error = document.getElementById("review-error");
  if (!error) return;

  error.textContent = message;
  error.hidden = false;
}

function bindSidebarActions(poi) {
  const visitBtn = document.getElementById("btn-register-visit");
  const favoriteBtn = document.getElementById("btn-add-favorite");

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
        // El backend acaba de acreditar puntos en el ledger: la copia de la
        // sesión se refresca para que el header y el dashboard lo reflejen.
        await refreshSessionPoints().catch(() => {});
      } else {
        visitBtn.disabled = false;
        visitBtn.querySelector("span").textContent = "Registrar Visita";
      }

      await openConfirmModal({
        title: result.success ? "Visita registrada" : "No se pudo validar",
        message: result.message,
        confirmLabel: "Entendido",
      });
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
}

function getUserCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 0, lng: 0 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          // La precisión viaja al backend: le sirve para auditar la validación.
          accuracy: pos.coords.accuracy ?? null,
        }),
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

  // La lista arranca plegada en cada visita: el estado es del módulo y sin
  // esto un POI heredaría el desplegado del anterior.
  reviewsExpanded = false;

  try {
    const [poi, reviews, favorite, visited, myReview] = await Promise.all([
      getPoiById(id),
      getPoiReviews(id),
      isFavorite(id),
      hasVisited(id),
      getMyReviewFor(id),
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

    const images = [...(poi.images || [poi.image])];

    root.parentElement.innerHTML = buildDetailHTML(poi, reviews, favorite, visited, myReview);
    loadIcons();

    initPoiGallery(images);
    initDetailMap(poi);
    bindBackButton();
    bindSidebarActions(poi);
    bindReviews(poi);

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
