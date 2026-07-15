import { getPois } from "../services/poi.service.js";
import { poiCard } from "../components/molecules/poisCard.js";
import { searchBar } from "../components/molecules/searchBar.js";
import { loadIcons } from "../utils/icons.js";
import { debounce } from "../utils/text.js";
import { ALL_CATEGORIES, getCategories, filterPois, sortPois } from "../utils/poiFilter.js";
import "/src/styles/pages/explore.css";

// Estado interno para filtros, ordenación y paginación.
let allPois = [];
let filteredPois = [];
let currentCategory = ALL_CATEGORIES;
let searchQuery = "";
let sortBy = "Recomendados";
let currentPage = 1;

// En Figma se ven filas de 4; 8 permite mostrar 2 filas completas en desktop.
const ITEMS_PER_PAGE = 8;

// Icono de Lucide asociado a cada categoría.
const CATEGORY_ICONS = {
  Naturaleza: "leaf",
  Cultura: "landmark",
  Gastronomía: "utensils",
  Religiosa: "church",
  Compras: "shopping-bag",
  [ALL_CATEGORIES]: "compass",
};

/**
 * Retorna la estructura HTML básica de la página de exploración.
 * Las píldoras de categoría se inyectan en initExplore() desde los datos reales.
 */
export function explore() {
  return `
    <div class="explore-page">
      <div class="explore-header-section">
        <div class="search-container-wrapper">
          ${searchBar()}
        </div>

        <!-- Píldoras de Categorías (scrollable en mobile, centrado en desktop) -->
        <div class="category-pills-container">
          <div class="category-pills-scroll" id="category-pills-scroll"></div>
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

      <div class="pagination-container" id="pagination-container"></div>
    </div>
  `;
}

/**
 * Inicializa eventos, filtros y carga de datos.
 * Lo ejecuta el enrutador tras insertar el HTML en el DOM.
 */
export async function initExplore() {
  resetState();

  try {
    allPois = await getPois();
  } catch (error) {
    console.error("Error al cargar los POIs en el frontend:", error);
    showErrorState();
    return;
  }

  renderCategoryPills();
  bindSearch();
  bindSort();
  applyFiltersAndRender();
}

function resetState() {
  currentCategory = ALL_CATEGORIES;
  searchQuery = "";
  sortBy = "Recomendados";
  currentPage = 1;
}

/**
 * Genera las píldoras de categoría a partir de los datos cargados.
 */
function renderCategoryPills() {
  const container = document.getElementById("category-pills-scroll");
  if (!container) return;

  container.innerHTML = getCategories(allPois)
    .map(
      (category) => `
      <button class="pill-btn ${category === currentCategory ? "active" : ""}"
              data-category="${category}">
        <i data-lucide="${CATEGORY_ICONS[category] ?? "compass"}"></i>
        <span>${category}</span>
      </button>
    `
    )
    .join("");

  container.querySelectorAll(".pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      currentCategory = pill.dataset.category;
      container.querySelectorAll(".pill-btn").forEach((p) => {
        p.classList.toggle("active", p.dataset.category === currentCategory);
      });
      currentPage = 1;
      applyFiltersAndRender();
    });
  });

  loadIcons();
}

/**
 * Enlaza el buscador. Filtra mientras se escribe (igual que el mapa) y
 * mantiene el submit del formulario para quien pulse Enter o el botón.
 */
function bindSearch() {
  const searchForm = document.querySelector(".search-bar");
  const searchInput = document.getElementById("search-poi");
  if (!searchInput) return;

  const runSearch = debounce(() => {
    currentPage = 1;
    applyFiltersAndRender();
  }, 250);

  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    runSearch();
  });

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    currentPage = 1;
    applyFiltersAndRender();
  });
}

function bindSort() {
  const sortSelect = document.getElementById("sort-select");
  sortSelect?.addEventListener("change", (event) => {
    sortBy = event.target.value;
    applyFiltersAndRender();
  });
}

/**
 * Filtra, ordena y renderiza la lista de POIs junto con su paginación.
 */
function applyFiltersAndRender() {
  filteredPois = sortPois(
    filterPois(allPois, { category: currentCategory, query: searchQuery }),
    sortBy
  );

  // Tras filtrar, la página actual puede quedar fuera de rango.
  const totalPages = Math.max(1, Math.ceil(filteredPois.length / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  updateResultsCount();
  renderGrid();
  renderPagination(totalPages);
}

function updateResultsCount() {
  const countEl = document.getElementById("results-count");
  if (!countEl) return;

  const noun = filteredPois.length === 1 ? "lugar encontrado" : "lugares encontrados";
  countEl.textContent = `${filteredPois.length} ${noun} cerca de ti`;
}

/**
 * Renderiza las tarjetas de la página actual.
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

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagePois = filteredPois.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  container.innerHTML = pagePois.map((poi) => poiCard({ ...poi, isFeatured: false })).join("");

  loadIcons();
}

/**
 * Renderiza la fila de paginación interactiva.
 * @param {number} totalPages - Total de páginas ya calculado.
 */
function renderPagination(totalPages) {
  const container = document.getElementById("pagination-container");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const pageButtons = Array.from(
    { length: totalPages },
    (_, index) => `
      <button class="pagination-btn ${index + 1 === currentPage ? "active" : ""}"
              data-page="${index + 1}">
        ${index + 1}
      </button>
    `
  ).join("");

  container.innerHTML = `
    <button class="pagination-btn arrow-btn" ${currentPage === 1 ? "disabled" : ""}
            data-page="${currentPage - 1}" aria-label="Página anterior">
      <i data-lucide="chevron-left"></i>
    </button>
    ${pageButtons}
    <button class="pagination-btn arrow-btn" ${currentPage === totalPages ? "disabled" : ""}
            data-page="${currentPage + 1}" aria-label="Página siguiente">
      <i data-lucide="chevron-right"></i>
    </button>
  `;

  container.querySelectorAll(".pagination-btn[data-page]:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => goToPage(Number(btn.dataset.page), totalPages));
  });

  loadIcons();
}

function goToPage(page, totalPages) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  applyFiltersAndRender();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showErrorState() {
  const container = document.getElementById("pois-grid-container");
  if (!container) return;
  container.innerHTML = `
    <div class="error-state">
      <p>Hubo un error al cargar los lugares. Por favor, intenta de nuevo.</p>
    </div>
  `;
}
