import { getPois } from "../services/poi.service.js";
import { loadIcons } from "../utils/icons.js";
import { debounce, normalizeText } from "../utils/text.js";
import {
  ALL_CATEGORIES,
  getCategories,
  filterPois,
  sortPois,
  withDistanceFrom,
} from "../utils/poiFilter.js";
import "/src/styles/pages/map.css";

// Centro por defecto cuando no hay geolocalización: Barranquilla, Colombia.
// ⚠️ Coordenada aproximada, pendiente de verificar como el resto de los POIs.
const DEFAULT_COORDS = { lat: 10.9878, lng: -74.7889 };
const DEFAULT_ZOOM = 13;
const FOCUS_ZOOM = 16;

// Estado interno de la vista del mapa.
let allPois = [];
let filteredPois = [];
let mapInstance = null;
let markersGroup = null;
let userMarker = null;
let markersByPoiId = new Map();
let userCoords = { ...DEFAULT_COORDS };
let hasUserLocation = false;
let currentCategory = ALL_CATEGORIES;
let searchQuery = "";

// Icono de Lucide asociado a cada categoría.
const CATEGORY_ICONS = {
  Naturaleza: "leaf",
  Cultura: "landmark",
  Gastronomía: "utensils",
  Religiosa: "church",
  Compras: "shopping-bag",
  [ALL_CATEGORIES]: "compass",
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] ?? "compass";
}

/**
 * Convierte una categoría en una clase CSS estable (sin tildes ni mayúsculas).
 */
function toCategoryClass(category) {
  return normalizeText(category);
}

/**
 * Retorna la estructura HTML de la página de mapa interactivo.
 * Las píldoras de categoría se inyectan en initMap() a partir de los datos reales.
 */
export function map() {
  return `
    <div class="map-page-container">

      <!-- Controles móviles flotantes (ocultos en desktop) -->
      <div class="map-mobile-controls">
        <div class="mobile-search-wrapper">
          <i data-lucide="search" class="search-icon"></i>
          <input type="search" id="mobile-map-search" class="mobile-search-input" placeholder="Buscar lugares mágicos..." autocomplete="off">
        </div>
        <div class="mobile-category-scroll" id="mobile-category-scroll"></div>
      </div>

      <!-- Barra Lateral Izquierda (Desktop) -->
      <aside class="map-sidebar">
        <div class="sidebar-search-section">
          <h3>Explorar Mapa</h3>
          <div class="sidebar-search-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="search" id="sidebar-map-search" class="sidebar-search-input" placeholder="Buscar lugares, hitos..." autocomplete="off">
          </div>

          <div class="sidebar-categories" id="sidebar-categories"></div>
        </div>

        <!-- Sección Cerca de ti -->
        <div class="sidebar-list-section">
          <h4 id="sidebar-list-heading">LUGARES DESTACADOS</h4>
          <div class="sidebar-pois-list" id="sidebar-pois-list">
            <div class="sidebar-loading">Cargando lugares cercanos...</div>
          </div>
        </div>
      </aside>

      <!-- Área del Mapa -->
      <main class="map-area-wrapper">
        <div id="map" class="map-leaflet-element"></div>

        <!-- Aviso de geolocalización: sin esto el fallo era invisible -->
        <div class="map-notice" id="map-notice" role="status" hidden>
          <i class="map-notice-icon" data-lucide="map-pin" aria-hidden="true"></i>
          <p class="map-notice-text" id="map-notice-text"></p>
          <button type="button" class="map-notice-retry" id="map-notice-retry">Reintentar</button>
          <button type="button" class="map-notice-close" id="map-notice-close" aria-label="Cerrar aviso">&times;</button>
        </div>

        <button class="map-locate-btn" id="btn-locate" type="button" aria-label="Centrar en mi ubicación">
          <i data-lucide="locate-fixed"></i>
        </button>

        <button class="btn btn--primary btn-route-float" id="btn-route-start">
          <i data-lucide="compass"></i>
          <span>Iniciar Ruta</span>
        </button>
      </main>

    </div>
  `;
}

/**
 * Inicialización de la vista del mapa. Se ejecuta tras inyectar el HTML al DOM.
 */
export async function initMap() {
  resetState();

  await setupMapAndData();

  requestUserLocation();
}

/**
 * Restablece el estado del módulo y destruye cualquier instancia previa de Leaflet.
 * Sin esto, volver a la vista lanza "Map container is already initialized".
 */
function resetState() {
  currentCategory = ALL_CATEGORIES;
  searchQuery = "";
  userCoords = { ...DEFAULT_COORDS };
  hasUserLocation = false;
  markersByPoiId = new Map();

  if (mapInstance) {
    try {
      mapInstance.remove();
    } catch (error) {
      console.warn("Error al remover instancia anterior de mapa:", error);
    }
  }

  mapInstance = null;
  markersGroup = null;
  userMarker = null;
}

/**
 * Configura la instancia de Leaflet y carga los datos de POIs.
 */
async function setupMapAndData() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  try {
    allPois = await getPois();
  } catch (error) {
    console.error("Error al cargar los POIs en el mapa:", error);
    showSidebarError();
    return;
  }

  // El contenedor puede haber desaparecido si el usuario navegó durante la carga.
  if (!document.getElementById("map")) return;

  mapInstance = L.map("map", { zoomControl: false }).setView(
    [userCoords.lat, userCoords.lng],
    DEFAULT_ZOOM
  );

  L.control.zoom({ position: "topright" }).addTo(mapInstance);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapInstance);

  markersGroup = L.layerGroup().addTo(mapInstance);

  drawUserMarker();
  renderCategoryPills();
  bindSearchInputs();
  bindRouteButton();
  bindLocationControls();

  applyFilters();

  // Leaflet necesita recalcular su tamaño tras la inserción en el DOM.
  setTimeout(() => mapInstance?.invalidateSize(), 100);
}

/**
 * Traduce el error de geolocalización a algo que el usuario pueda accionar.
 * @param {GeolocationPositionError} error
 * @returns {string} Mensaje para mostrar en el aviso.
 */
function geolocationMessage(error) {
  switch (error?.code) {
    case 1: // PERMISSION_DENIED
      return "Bloqueaste el acceso a tu ubicación. Actívala en el candado de la barra de direcciones para ver qué tienes cerca.";
    case 2: // POSITION_UNAVAILABLE
      return "No pudimos determinar tu ubicación. Mostramos el centro de Barranquilla.";
    case 3: // TIMEOUT
      return "Tu ubicación tardó demasiado en responder. Mostramos el centro de Barranquilla.";
    default:
      return "No pudimos acceder a tu ubicación. Mostramos el centro de Barranquilla.";
  }
}

/**
 * Pide la geolocalización y recentra el mapa si se concede.
 * Si falla, avisa en pantalla: antes solo quedaba constancia en la consola y
 * el usuario no tenía forma de saber por qué el mapa no le seguía.
 */
function requestUserLocation() {
  if (!navigator.geolocation) {
    showLocationNotice("Tu navegador no permite compartir la ubicación.");
    return;
  }

  // Sin contexto seguro el navegador deniega la petición sin preguntar.
  // Pasa al abrir la app por IP de red local en vez de localhost.
  if (!window.isSecureContext) {
    showLocationNotice(
      "La ubicación necesita una conexión segura (https o localhost). Mostramos el centro de Barranquilla."
    );
    return;
  }

  setLocationButtonState("locating");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      hasUserLocation = true;
      setLocationButtonState("idle");
      hideLocationNotice();
      updateUserLocationOnMap();
    },
    (error) => {
      console.warn("Geolocalización no disponible:", error.message);
      hasUserLocation = false;
      setLocationButtonState("idle");
      showLocationNotice(geolocationMessage(error));
    },
    // Precisión alta no aporta en escritorio y agota el tiempo con facilidad,
    // así que se da margen y se acepta una lectura reciente de la caché.
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
}

/**
 * Genera las píldoras de categoría a partir de los datos, en sidebar y en móvil.
 */
function renderCategoryPills() {
  const categories = getCategories(allPois);

  const buildPills = (container) => {
    if (!container) return;
    container.innerHTML = categories
      .map(
        (category) => `
        <button class="pill-btn ${category === currentCategory ? "active" : ""}"
                data-category="${category}">
          <i data-lucide="${getCategoryIcon(category)}"></i>
          <span>${category}</span>
        </button>
      `
      )
      .join("");
  };

  buildPills(document.getElementById("sidebar-categories"));
  buildPills(document.getElementById("mobile-category-scroll"));

  document.querySelectorAll(".pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      currentCategory = pill.dataset.category;
      syncActivePills();
      applyFilters();
    });
  });

  loadIcons();
}

/**
 * Marca como activa la píldora de la categoría actual en ambas barras.
 */
function syncActivePills() {
  document.querySelectorAll(".pill-btn").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.category === currentCategory);
  });
}

/**
 * Enlaza los dos buscadores (sidebar y móvil) manteniéndolos sincronizados.
 */
function bindSearchInputs() {
  const sidebarSearch = document.getElementById("sidebar-map-search");
  const mobileSearch = document.getElementById("mobile-map-search");

  const runSearch = debounce(() => applyFilters(), 200);

  const handleInput = (source, mirror) => (event) => {
    searchQuery = event.target.value;
    if (mirror) mirror.value = event.target.value;
    runSearch();
  };

  sidebarSearch?.addEventListener("input", handleInput(sidebarSearch, mobileSearch));
  mobileSearch?.addEventListener("input", handleInput(mobileSearch, sidebarSearch));
}

function bindRouteButton() {
  const routeBtn = document.getElementById("btn-route-start");
  routeBtn?.addEventListener("click", () => {
    alert("Calculando la ruta turística óptima basada en tus intereses actuales...");
  });
}

/**
 * Botón de centrar en mi ubicación y controles del aviso.
 */
function bindLocationControls() {
  document.getElementById("btn-locate")?.addEventListener("click", () => {
    if (hasUserLocation) {
      mapInstance?.setView([userCoords.lat, userCoords.lng], FOCUS_ZOOM, { animate: true });
      userMarker?.openPopup();
      return;
    }
    // Aún no la tenemos: volver a pedirla en vez de no hacer nada.
    requestUserLocation();
  });

  document.getElementById("map-notice-retry")?.addEventListener("click", () => {
    hideLocationNotice();
    requestUserLocation();
  });

  document.getElementById("map-notice-close")?.addEventListener("click", hideLocationNotice);
}

/**
 * Muestra el aviso de ubicación con un mensaje accionable.
 * @param {string} message
 */
function showLocationNotice(message) {
  const notice = document.getElementById("map-notice");
  const text = document.getElementById("map-notice-text");
  if (!notice || !text) return;

  text.textContent = message;
  notice.hidden = false;
}

function hideLocationNotice() {
  const notice = document.getElementById("map-notice");
  if (notice) notice.hidden = true;
}

/**
 * Refleja en el botón que se está buscando la ubicación.
 * @param {"idle"|"locating"} state
 */
function setLocationButtonState(state) {
  const btn = document.getElementById("btn-locate");
  if (!btn) return;

  const locating = state === "locating";
  btn.classList.toggle("is-locating", locating);
  btn.disabled = locating;
  btn.setAttribute(
    "aria-label",
    locating ? "Buscando tu ubicación" : "Centrar en mi ubicación"
  );
}

/**
 * Redibuja el marcador del usuario, recentra el mapa y recalcula distancias.
 */
function updateUserLocationOnMap() {
  if (!mapInstance) return;

  drawUserMarker();
  mapInstance.setView([userCoords.lat, userCoords.lng], DEFAULT_ZOOM);
  applyFilters();
}

/**
 * Pinta o mueve el marcador de posición del usuario.
 * Solo se dibuja si la geolocalización se resolvió: pintarlo sobre el centro
 * por defecto afirmaría que el usuario está donde no está.
 */
function drawUserMarker() {
  if (!mapInstance) return;

  if (userMarker) {
    mapInstance.removeLayer(userMarker);
    userMarker = null;
  }

  if (!hasUserLocation) return;

  const userIcon = L.divIcon({
    className: "user-location-marker",
    html: `<div class="user-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
    .addTo(mapInstance)
    .bindPopup("<b>Tu ubicación actual</b>");
}

/**
 * Filtra los POIs según búsqueda y categoría, los ordena por cercanía
 * y refresca marcadores y barra lateral.
 */
function applyFilters() {
  const matches = filterPois(allPois, {
    category: currentCategory,
    query: searchQuery,
  });

  // Sin ubicación real, ordenar por cercanía no significa nada: se ordena por
  // valoración y no se muestran distancias inventadas desde el centro.
  filteredPois = hasUserLocation
    ? sortPois(withDistanceFrom(matches, userCoords), "Distancia")
    : sortPois(matches, "Recomendados");

  updateMarkers();
  updateSidebarList();
  updateSidebarHeading();
}

/**
 * El encabezado solo promete cercanía cuando sabemos dónde está el usuario.
 */
function updateSidebarHeading() {
  const heading = document.getElementById("sidebar-list-heading");
  if (heading) {
    heading.textContent = hasUserLocation ? "CERCA DE TI" : "LUGARES DESTACADOS";
  }
}

/**
 * Actualiza los pines del mapa a partir de los POIs filtrados.
 */
function updateMarkers() {
  if (!markersGroup || !mapInstance) return;

  markersGroup.clearLayers();
  markersByPoiId.clear();

  filteredPois.forEach((poi) => {
    const categoryClass = toCategoryClass(poi.category);

    const markerIcon = L.divIcon({
      className: "custom-map-marker-wrapper",
      html: `
        <div class="marker-pin-bubble ${categoryClass}">
          <i data-lucide="${getCategoryIcon(poi.category)}"></i>
        </div>
        <div class="marker-pin-shadow"></div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -40],
    });

    const popupContent = `
      <div class="map-popup-card">
        <img src="${poi.image}" alt="${poi.name}" class="popup-card-img">
        <div class="popup-card-content">
          <span class="popup-category ${categoryClass}">${poi.category}</span>
          <h4 class="popup-title">${poi.name}</h4>
          <div class="popup-rating">
            <i data-lucide="star" class="star-mini"></i>
            <span>${poi.rating.toFixed(1)}</span>
            <span class="popup-points">+${poi.points} pts</span>
          </div>
          <a href="/poi/${poi.id}" data-link class="btn btn--primary btn-popup-more">Ver más</a>
        </div>
      </div>
    `;

    const marker = L.marker([poi.lat, poi.lng], { icon: markerIcon })
      .addTo(markersGroup)
      .bindPopup(popupContent);

    markersByPoiId.set(poi.id, marker);
  });

  loadIcons();
}

/**
 * Renderiza la lista "Cerca de ti" de la barra lateral.
 */
function updateSidebarList() {
  const listContainer = document.getElementById("sidebar-pois-list");
  if (!listContainer) return;

  if (filteredPois.length === 0) {
    listContainer.innerHTML = `
      <div class="sidebar-empty">
        <p>No hay lugares que coincidan con tu filtro.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filteredPois.map(renderSidebarItem).join("");

  listContainer.querySelectorAll(".sidebar-poi-item").forEach((item) => {
    item.addEventListener("click", () => focusPoi(Number(item.dataset.poiId)));
  });

  loadIcons();
}

function renderSidebarItem(poi) {
  // La distancia solo existe si conocemos la ubicación del usuario.
  const distanceLabel =
    poi.distance === undefined
      ? ""
      : poi.distance < 1
        ? `A ${Math.round(poi.distance * 1000)} m de distancia`
        : `A ${poi.distance.toFixed(1)} km de distancia`;

  return `
    <div class="sidebar-poi-item" data-poi-id="${poi.id}">
      <img src="${poi.image}" alt="${poi.name}" class="item-thumb">
      <div class="item-info">
        <h5 class="item-title">${poi.name}</h5>
        <div class="item-rating-row">
          <i data-lucide="star" class="star-mini"></i>
          <span class="item-rating">${poi.rating.toFixed(1)}</span>
          <span class="item-category">${poi.category}</span>
        </div>
        ${distanceLabel ? `<span class="item-distance">${distanceLabel}</span>` : ""}
      </div>
    </div>
  `;
}

/**
 * Centra el mapa en un POI concreto y abre su popup.
 */
function focusPoi(poiId) {
  const poi = filteredPois.find((item) => item.id === poiId);
  const marker = markersByPoiId.get(poiId);
  if (!poi || !marker || !mapInstance) return;

  mapInstance.setView([poi.lat, poi.lng], FOCUS_ZOOM, { animate: true });
  marker.openPopup();
}

function showSidebarError() {
  const listContainer = document.getElementById("sidebar-pois-list");
  if (!listContainer) return;
  listContainer.innerHTML = `
    <div class="sidebar-empty">
      <p>No pudimos cargar los lugares. Inténtalo de nuevo.</p>
    </div>
  `;
}
