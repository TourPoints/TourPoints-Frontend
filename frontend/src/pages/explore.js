import { getPois } from "../services/poi.service.js";
import { poiCard } from "../components/molecules/poisCard.js";
import { searchBar } from "../components/molecules/searchBar.js";
import "/src/styles/pages/explore.css";

// Estado interno para filtros, ordenación y paginación
let allPois = [];
let filteredPois = [];
let currentCategory = "Todas";
let searchQuery = "";
let sortBy = "Recomendados";
let currentPage = 1;
const itemsPerPage = 8; // En Figma se ven filas de 4. 8 permite mostrar 2 filas en desktop.

/**
 * Retorna la estructura HTML básica de la página de exploración.
 */
export function explore() {
  return `
    <div class="explore-page">
      <div class="explore-header-section">
        <!-- Contenedor del buscador -->
        <div class="search-container-wrapper">
          ${searchBar()}
        </div>
        
        <!-- Píldoras de Categorías (scrollable en mobile, centrado en desktop) -->
        <div class="category-pills-container">
          <div class="category-pills-scroll">
            <button class="pill-btn active" data-category="Todas">
              <i data-lucide="compass"></i>
              <span>Todas</span>
            </button>
            <button class="pill-btn" data-category="Cultura">
              <i data-lucide="landmark"></i>
              <span>Cultura</span>
            </button>
            <button class="pill-btn" data-category="Naturaleza">
              <i data-lucide="leaf"></i>
              <span>Naturaleza</span>
            </button>
            <button class="pill-btn" data-category="Gastronomía">
              <i data-lucide="utensils"></i>
              <span>Gastronomía</span>
            </button>
            <button class="pill-btn" data-category="Religiosa">
              <i data-lucide="church"></i>
              <span>Religiosa</span>
            </button>
            <button class="pill-btn" data-category="Compras">
              <i data-lucide="shopping-bag"></i>
              <span>Compras</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Fila de cabecera de resultados y filtros de ordenación -->
      <div class="explore-title-row">
        <div class="explore-title-left">
          <h2>Explora destinos</h2>
          <span class="results-count" id="results-count">Cargando lugares...</span>
        </div>
        <div class="explore-sort-right">
          <label for="sort-select">Ordenar por:</label>
          <select id="sort-select" class="sort-dropdown">
            <option value="Recomendados">Recomendados</option>
            <option value="PuntosDesc">Más puntos (+ a -)</option>
            <option value="PuntosAsc">Menos puntos (- a +)</option>
            <option value="Nombre">Nombre (A-Z)</option>
          </select>
        </div>
      </div>
      
      <!-- Grid de tarjetas de Puntos de Interés -->
      <div class="explore-grid" id="pois-grid-container">
        <div class="loading-state">Cargando puntos de interés...</div>
      </div>
      
      <!-- Paginación -->
      <div class="pagination-container" id="pagination-container">
        <!-- Renderizado dinámico de la paginación -->
      </div>
    </div>
  `;
}

/**
 * Inicializa los eventos, búsquedas, filtros y carga los datos de los POIs.
 * Se ejecuta automáticamente después de que el enrutador inserta el HTML en el DOM.
 */
export async function initExplore() {
  // Reiniciar estado cada vez que se carga la página
  currentCategory = "Todas";
  searchQuery = "";
  sortBy = "Recomendados";
  currentPage = 1;
  
  // Capturar elementos del DOM
  const searchForm = document.querySelector(".search-bar");
  const searchInput = document.getElementById("search-poi");
  const sortSelect = document.getElementById("sort-select");
  const pills = document.querySelectorAll(".pill-btn");
  
  // Cargar datos del servicio
  try {
    allPois = await getPois();
    applyFiltersAndRender();
  } catch (error) {
    console.error("Error al cargar los POIs en el frontend:", error);
    const container = document.getElementById("pois-grid-container");
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <p>Hubo un error al cargar los lugares. Por favor, intenta de nuevo.</p>
        </div>
      `;
    }
  }
  
  // Evento de búsqueda por formulario
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (searchInput) {
        searchQuery = searchInput.value.trim().toLowerCase();
        currentPage = 1;
        applyFiltersAndRender();
      }
    });
  }
  
  // Limpieza rápida del input de búsqueda
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      if (e.target.value === "") {
        searchQuery = "";
        currentPage = 1;
        applyFiltersAndRender();
      }
    });
  }
  
  // Evento en píldoras de categorías
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.getAttribute("data-category");
      currentPage = 1;
      applyFiltersAndRender();
    });
  });
  
  // Evento de ordenación
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      sortBy = e.target.value;
      applyFiltersAndRender();
    });
  }
}

/**
 * Filtra, ordena y renderiza de forma reactiva la lista de POIs y la paginación.
 */
function applyFiltersAndRender() {
  // 1. Filtrar por categoría y texto de búsqueda
  filteredPois = allPois.filter((poi) => {
    const matchesCategory = currentCategory === "Todas" || poi.category === currentCategory;
    const matchesSearch = 
      poi.name.toLowerCase().includes(searchQuery) ||
      poi.description.toLowerCase().includes(searchQuery) ||
      poi.location.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });
  
  // 2. Ordenar
  if (sortBy === "Recomendados") {
    filteredPois.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "PuntosDesc") {
    filteredPois.sort((a, b) => b.points - a.points);
  } else if (sortBy === "PuntosAsc") {
    filteredPois.sort((a, b) => a.points - b.points);
  } else if (sortBy === "Nombre") {
    filteredPois.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Actualizar el contador de resultados
  const countEl = document.getElementById("results-count");
  if (countEl) {
    countEl.textContent = `${filteredPois.length} ${
      filteredPois.length === 1 ? "lugar encontrado" : "lugares encontrados"
    } cerca de ti`;
  }
  
  renderGrid();
  renderPagination();
}

/**
 * Renderiza el grid de tarjetas de POIs correspondientes a la página actual.
 */
function renderGrid() {
  const container = document.getElementById("pois-grid-container");
  if (!container) return;
  
  if (filteredPois.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No encontramos lugares que coincidan con tu búsqueda.</p>
        <span>Prueba seleccionando otra categoría o cambiando la palabra clave.</span>
      </div>
    `;
    return;
  }
  
  // Obtener subconjunto según paginación
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPois = filteredPois.slice(startIndex, startIndex + itemsPerPage);
  
  // Generar HTML y asignar al contenedor
  container.innerHTML = paginatedPois
    .map((poi) => {
      // Usamos el poiCard existente garantizando que no sea destacada en la cuadrícula general de exploración
      return poiCard({ ...poi, isFeatured: false });
    })
    .join("");
  
  // Recargar los iconos de Lucide dinámicos
  import("../utils/icons.js").then(({ loadIcons }) => loadIcons());
}

/**
 * Renderiza la fila de paginación interactiva.
 */
function renderPagination() {
  const container = document.getElementById("pagination-container");
  if (!container) return;
  
  const totalPages = Math.ceil(filteredPois.length / itemsPerPage);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  
  let html = "";
  
  // Botón Anterior
  html += `
    <button class="pagination-btn arrow-btn" ${currentPage === 1 ? "disabled" : ""} id="prev-page-btn" aria-label="Página anterior">
      <i data-lucide="chevron-left"></i>
    </button>
  `;
  
  // Números de páginas
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="pagination-btn ${i === currentPage ? "active" : ""}" data-page="${i}">
        ${i}
      </button>
    `;
  }
  
  // Botón Siguiente
  html += `
    <button class="pagination-btn arrow-btn" ${currentPage === totalPages ? "disabled" : ""} id="next-page-btn" aria-label="Página siguiente">
      <i data-lucide="chevron-right"></i>
    </button>
  `;
  
  container.innerHTML = html;
  
  // Vincular eventos de clics a los botones de paginación
  const prevBtn = document.getElementById("prev-page-btn");
  const nextBtn = document.getElementById("next-page-btn");
  const pageBtns = container.querySelectorAll(".pagination-btn[data-page]");
  
  if (prevBtn && currentPage > 1) {
    prevBtn.addEventListener("click", () => {
      currentPage--;
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  
  if (nextBtn && currentPage < totalPages) {
    nextBtn.addEventListener("click", () => {
      currentPage++;
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  
  pageBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.getAttribute("data-page"));
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  
  // Recargar los iconos de las flechas
  import("../utils/icons.js").then(({ loadIcons }) => loadIcons());
}
