import { getPois } from "../services/poi.service.js";
import "/src/styles/pages/map.css";

// Estado interno para la vista del mapa
let allPois = [];
let filteredPois = [];
let mapInstance = null;
let markersGroup = null;
let userMarker = null;
let userCoords = { lat: 40.416775, lng: -3.703790 }; // Centro por defecto: Madrid (Puerta del Sol)
let currentCategory = "Todas";
let searchQuery = "";

// Mapeo de iconos para cada categoría
function getCategoryIcon(category) {
  switch (category) {
    case "Naturaleza": return "leaf";
    case "Cultura": return "landmark";
    case "Gastronomía": return "utensils";
    case "Religiosa": return "church";
    case "Compras": return "shopping-bag";
    default: return "compass";
  }
}

/**
 * Retorna la estructura HTML de la página de mapa interactivo.
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
        <div class="mobile-category-scroll">
          <button class="pill-btn active" data-category="Todas">Todo</button>
          <button class="pill-btn" data-category="Cultura">Cultura</button>
          <button class="pill-btn" data-category="Naturaleza">Naturaleza</button>
          <button class="pill-btn" data-category="Gastronomía">Gastronomía</button>
          <button class="pill-btn" data-category="Religiosa">Religiosa</button>
          <button class="pill-btn" data-category="Compras">Compras</button>
        </div>
      </div>

      <!-- Barra Lateral Izquierda (Desktop) -->
      <aside class="map-sidebar">
        <div class="sidebar-search-section">
          <h3>Explorar Mapa</h3>
          <div class="sidebar-search-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="search" id="sidebar-map-search" class="sidebar-search-input" placeholder="Buscar lugares, hitos..." autocomplete="off">
          </div>
          
          <!-- Píldoras de Categorías (Sidebar) -->
          <div class="sidebar-categories">
            <button class="pill-btn active" data-category="Todas">Todos</button>
            <button class="pill-btn" data-category="Cultura">Cultura</button>
            <button class="pill-btn" data-category="Naturaleza">Naturaleza</button>
          </div>
        </div>

        <!-- Sección Cerca de ti -->
        <div class="sidebar-list-section">
          <h4>CERCA DE TI</h4>
          <div class="sidebar-pois-list" id="sidebar-pois-list">
            <div class="sidebar-loading">Cargando lugares cercanos...</div>
          </div>
        </div>
      </aside>

      <!-- Área del Mapa -->
      <main class="map-area-wrapper">
        <div id="map" class="map-leaflet-element"></div>
        
        <!-- Botón flotante Iniciar Ruta -->
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
  // Reiniciar estados locales
  currentCategory = "Todas";
  searchQuery = "";
  
  // Limpieza de instancia previa de Leaflet (Evita error 'Map container is already initialized')
  if (mapInstance) {
    try {
      mapInstance.remove();
    } catch (e) {
      console.warn("Error al remover instancia anterior de mapa:", e);
    }
    mapInstance = null;
    markersGroup = null;
    userMarker = null;
  }

  // Restablecer coordenadas de usuario por defecto
  userCoords = { lat: 40.416775, lng: -3.703790 };

  // 1. Inicializar el mapa de inmediato con coordenadas por defecto para evitar pantallas en blanco
  setupMapAndData();

  // 2. Intentar obtener geolocalización real de forma asíncrona (con timeout de 4s)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords.lat = position.coords.latitude;
        userCoords.lng = position.coords.longitude;
        updateUserLocationOnMap();
      },
      (error) => {
        console.warn("Geolocalización no disponible. Se mantiene Madrid centro.", error.message);
      },
      { 
        enableHighAccuracy: true,
        timeout: 4000, 
        maximumAge: 0 
      }
    );
  }
}

/**
 * Configura la instancia de Leaflet y carga los datos de POIs.
 */
async function setupMapAndData() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  // Cargar datos de POIs
  try {
    allPois = await getPois();
    filteredPois = [...allPois];
  } catch (error) {
    console.error("Error al cargar los POIs en el mapa:", error);
    return;
  }

  // Inicializar mapa de Leaflet
  mapInstance = L.map('map', {
    zoomControl: false
  }).setView([userCoords.lat, userCoords.lng], 14);

  // Agregar botones de zoom en la parte superior derecha
  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  // Cargar capa de mosaicos de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance);

  // Grupo de marcadores
  markersGroup = L.layerGroup().addTo(mapInstance);

  // Pintar marcador del usuario
  drawUserMarker();

  // Enlazar eventos de los inputs de búsqueda
  const sidebarSearch = document.getElementById("sidebar-map-search");
  const mobileSearch = document.getElementById("mobile-map-search");
  
  if (sidebarSearch) {
    sidebarSearch.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (mobileSearch) mobileSearch.value = e.target.value; // Sincronizar
      applyFilters();
    });
  }

  if (mobileSearch) {
    mobileSearch.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (sidebarSearch) sidebarSearch.value = e.target.value; // Sincronizar
      applyFilters();
    });
  }

  // Enlazar píldoras de categorías (píldoras en sidebar y en mobile)
  const pills = document.querySelectorAll(".pill-btn");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => {
        if (p.getAttribute("data-category") === pill.getAttribute("data-category")) {
          p.classList.add("active");
        } else {
          p.classList.remove("active");
        }
      });
      currentCategory = pill.getAttribute("data-category");
      applyFilters();
    });
  });

  // Evento para el botón Iniciar Ruta
  const routeBtn = document.getElementById("btn-route-start");
  if (routeBtn) {
    routeBtn.addEventListener("click", () => {
      alert("Calculando la ruta turística óptima basada en tus intereses actuales...");
    });
  }

  // Renderizar marcadores y sidebar iniciales
  applyFilters();

  // Forzar redibujado de tamaño de Leaflet para prevenir problemas de renderizado incompleto
  setTimeout(() => {
    if (mapInstance) {
      mapInstance.invalidateSize();
    }
  }, 100);
}

/**
 * Pinta o mueve el marcador de posición del usuario en el mapa.
 */
function drawUserMarker() {
  if (!mapInstance) return;

  if (userMarker) {
    mapInstance.removeLayer(userMarker);
  }

  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="user-pulse"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
    .addTo(mapInstance)
    .bindPopup("<b>Tu ubicación actual</b>");
}

/**
 * Actualiza la ubicación del usuario si se resuelve la geolocalización.
 */
function updateUserLocationOnMap() {
  if (!mapInstance) return;

  // Redibujar marcador en las nuevas coordenadas
  drawUserMarker();

  // Centrar mapa
  mapInstance.setView([userCoords.lat, userCoords.lng], 14);

  // Recalcular distancias y refrescar la barra lateral
  applyFilters();
}

/**
 * Filtra los POIs basados en la búsqueda y categoría actual, y actualiza mapa y barra lateral.
 */
function applyFilters() {
  filteredPois = allPois.filter(poi => {
    const matchesCategory = currentCategory === "Todas" || poi.category === currentCategory;
    const matchesSearch = poi.name.toLowerCase().includes(searchQuery) ||
                          poi.description.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Calcular distancias dinámicas
  filteredPois = filteredPois.map(poi => {
    const dist = calculateHaversine(userCoords.lat, userCoords.lng, poi.lat, poi.lng);
    return { ...poi, distance: dist };
  });

  // Ordenar por cercanía
  filteredPois.sort((a, b) => a.distance - b.distance);

  updateMarkers();
  updateSidebarList();
}

/**
 * Actualiza los pines de marcadores en el mapa Leaflet.
 */
function updateMarkers() {
  if (!markersGroup || !mapInstance) return;
  markersGroup.clearLayers();

  filteredPois.forEach(poi => {
    const categoryClass = poi.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const iconName = getCategoryIcon(poi.category);

    const customMarkerIcon = L.divIcon({
      className: 'custom-map-marker-wrapper',
      html: `
        <div class="marker-pin-bubble ${categoryClass}">
          <i data-lucide="${iconName}"></i>
        </div>
        <div class="marker-pin-shadow"></div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -40]
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

    const marker = L.marker([poi.lat, poi.lng], { icon: customMarkerIcon })
      .addTo(markersGroup)
      .bindPopup(popupContent);

    poi.markerInstance = marker;
  });

  // Recargar los iconos de Lucide
  import("../utils/icons.js").then(({ loadIcons }) => loadIcons());
}

/**
 * Renderiza la lista de lugares en la barra lateral "Cerca de ti".
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

  listContainer.innerHTML = filteredPois.map(poi => {
    const formattedDistance = poi.distance < 1 
      ? `A ${Math.round(poi.distance * 1000)}m de distancia` 
      : `A ${poi.distance.toFixed(1)}km de distancia`;

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
          <span class="item-distance">${formattedDistance}</span>
        </div>
      </div>
    `;
  }).join("");

  // Vincular eventos de clic en la barra lateral
  const items = listContainer.querySelectorAll(".sidebar-poi-item");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const poiId = Number(item.getAttribute("data-poi-id"));
      const poi = filteredPois.find(p => p.id === poiId);
      if (poi && poi.markerInstance && mapInstance) {
        mapInstance.setView([poi.lat, poi.lng], 16, { animate: true });
        poi.markerInstance.openPopup();
      }
    });
  });

  // Recargar iconos
  import("../utils/icons.js").then(({ loadIcons }) => loadIcons());
}

/**
 * Calcula la distancia en kilómetros usando la fórmula de Haversine.
 */
function calculateHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
