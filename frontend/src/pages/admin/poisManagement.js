// src/pages/admin/poisManagement.js
// US TOUR-40 – Gestión de Puntos de Interés (Admin)
//
// Opera sobre los mismos POIs que consumen el mapa y la vista de exploración,
// a través de poi.service.js. Lo que se cree o desactive aquí se refleja en el
// sitio público. Cuando exista el backend, solo cambia el servicio.

import {
  getAllPois,
  createPoi,
  updatePoi,
  deletePoi,
  togglePoiStatus,
  POI_STATUSES,
  PUBLISHED_STATUS,
} from "../../services/poi.service.js";
import { openFormModal, openConfirmModal, escapeHtml } from "../../components/organism/modal.js";
import { isAdmin } from "../../utils/role.js";
import { normalizeText, debounce } from "../../utils/text.js";
import { getCategories, filterPois, ALL_CATEGORIES } from "../../utils/poiFilter.js";
import { accessDenied } from "./accessDenied.js";

const ITEMS_PER_PAGE = 8;

// Estado de la vista.
let allPois = [];
let visiblePois = [];
let searchQuery = "";
let currentPage = 1;

/** Clase CSS del badge de categoría. */
function categoryBadge(category) {
  return `<span class="badge badge-${normalizeText(category)}">${escapeHtml(category)}</span>`;
}

/** Punto de estado coloreado. */
function statusDot(status) {
  const cls = normalizeText(status);
  return `<span class="status-dot status-${cls}">${escapeHtml(status)}</span>`;
}

/**
 * Campos del formulario de POI, compartidos por creación y edición.
 * @returns {Array<Object>} Definición de campos para el modal.
 */
function poiFields() {
  const categories = getCategories(allPois).filter((c) => c !== ALL_CATEGORIES);

  return [
    { name: "name", label: "Nombre del POI", required: true, wide: true },
    { name: "category", label: "Categoría", type: "select", options: categories, required: true },
    { name: "status", label: "Estado", type: "select", options: POI_STATUSES, required: true },
    { name: "location", label: "Ubicación", placeholder: "Madrid, ES", required: true },
    { name: "address", label: "Dirección", placeholder: "Calle, número, CP" },
    { name: "lat", label: "Latitud", type: "number", step: "any", required: true },
    { name: "lng", label: "Longitud", type: "number", step: "any", required: true },
    { name: "points", label: "Puntos", type: "number", min: 0, required: true },
    { name: "rating", label: "Valoración", type: "number", step: "0.1", min: 0, max: 5 },
    { name: "image", label: "URL de la imagen", wide: true, placeholder: "https://..." },
    { name: "description", label: "Descripción", type: "textarea", wide: true },
  ];
}

/**
 * Retorna la estructura HTML de la página. Los datos los inyecta initPoisManagement.
 */
export function poisManagement() {
  if (!isAdmin()) return accessDenied();

  return `
    <div class="admin-page-header">
      <h1 class="admin-page-title">Gestión de POIs</h1>
      <button class="btn-primary" id="btn-nuevo-poi">+ Nuevo POI</button>
    </div>

    <div class="admin-stats" id="poi-stats"></div>

    <div class="admin-table-section">
      <div class="admin-table-toolbar">
        <div class="admin-search">
          <span class="admin-search-icon">🔍</span>
          <input type="text" id="poi-search" placeholder="Buscar puntos de interés..." autocomplete="off" />
        </div>
      </div>

      <div class="admin-table-scroll">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Nombre del POI</th>
              <th>Categoría</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Puntos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="poi-tbody">
            <tr><td colspan="6" class="admin-empty">Cargando puntos de interés...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="admin-pagination" id="poi-pagination"></div>
    </div>
  `;
}

/**
 * Carga los datos y engancha los eventos. La ejecuta el router tras el render.
 */
export async function initPoisManagement() {
  if (!isAdmin()) return;

  searchQuery = "";
  currentPage = 1;

  await refresh();

  document.getElementById("btn-nuevo-poi")?.addEventListener("click", handleCreate);

  const search = document.getElementById("poi-search");
  const runSearch = debounce(() => {
    currentPage = 1;
    render();
  }, 250);

  search?.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    runSearch();
  });
}

/** Recarga los POIs desde el servicio y repinta. */
async function refresh() {
  try {
    allPois = await getAllPois();
  } catch (error) {
    console.error("Error al cargar los POIs del panel admin:", error);
    showTableError();
    return;
  }
  render();
}

/** Aplica la búsqueda y repinta stats, tabla y paginación. */
function render() {
  visiblePois = filterPois(allPois, { category: ALL_CATEGORIES, query: searchQuery });

  const totalPages = Math.max(1, Math.ceil(visiblePois.length / ITEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;

  renderStats();
  renderTable();
  renderPagination(totalPages);
}

/** Métricas calculadas de los datos reales, no cifras fijas. */
function renderStats() {
  const container = document.getElementById("poi-stats");
  if (!container) return;

  const total = allPois.length;
  const active = allPois.filter((p) => p.status === PUBLISHED_STATUS).length;
  const pending = allPois.filter((p) => p.status === "Pendiente").length;
  const avgRating = total
    ? (allPois.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / total).toFixed(1)
    : "0.0";

  const cards = [
    { icon: "📍", label: "Total POIs", value: total, badge: `${total} en total`, cls: "info" },
    { icon: "✅", label: "Publicados", value: active, badge: "Visibles al público", cls: "up" },
    { icon: "🕒", label: "Pendientes", value: pending, badge: "Por revisar", cls: "new" },
    { icon: "⭐", label: "Calificación Avg.", value: avgRating, badge: "Rating", cls: "info" },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon">${card.icon}</span>
          <span class="stat-badge ${card.cls}">${escapeHtml(card.badge)}</span>
        </div>
        <div class="stat-label">${escapeHtml(card.label)}</div>
        <div class="stat-value">${escapeHtml(card.value)}</div>
      </div>
    `
    )
    .join("");
}

/** Pinta las filas de la página actual. */
function renderTable() {
  const tbody = document.getElementById("poi-tbody");
  if (!tbody) return;

  if (visiblePois.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">
      No hay POIs que coincidan con la búsqueda.
    </td></tr>`;
    return;
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagePois = visiblePois.slice(start, start + ITEMS_PER_PAGE);

  tbody.innerHTML = pagePois
    .map(
      (poi) => `
      <tr data-id="${escapeHtml(poi.id)}">
        <td>
          <div class="poi-cell">
            <div class="poi-thumb">
              <img src="${escapeHtml(poi.image)}" alt="" loading="lazy">
            </div>
            <div>
              <div class="poi-name">${escapeHtml(poi.name)}</div>
              <div class="poi-id">ID: ${escapeHtml(poi.id)}</div>
            </div>
          </div>
        </td>
        <td>${categoryBadge(poi.category)}</td>
        <td>${escapeHtml(poi.location)}</td>
        <td>${statusDot(poi.status)}</td>
        <td><span class="points-val">${escapeHtml(poi.points)} pts</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit" title="Editar" data-action="edit">✏️</button>
            <button class="btn-icon" title="Publicar / despublicar" data-action="toggle">🔄</button>
            <button class="btn-icon del" title="Eliminar" data-action="delete">🗑️</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-action]").forEach((btn) => {
    const id = btn.closest("tr").dataset.id;
    const actions = { edit: handleEdit, toggle: handleToggle, delete: handleDelete };
    btn.addEventListener("click", () => actions[btn.dataset.action](id));
  });
}

/** Pinta la paginación con el conteo real. */
function renderPagination(totalPages) {
  const container = document.getElementById("poi-pagination");
  if (!container) return;

  const start = visiblePois.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, visiblePois.length);

  const pages =
    totalPages <= 1
      ? ""
      : Array.from(
          { length: totalPages },
          (_, i) => `
          <button class="page-btn ${i + 1 === currentPage ? "active" : ""}" data-page="${i + 1}">
            ${i + 1}
          </button>`
        ).join("");

  container.innerHTML = `
    <span class="pagination-info">
      Mostrando ${start} a ${end} de ${visiblePois.length} resultados
    </span>
    <div class="pagination-pages">
      ${
        totalPages <= 1
          ? ""
          : `
        <button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>‹</button>
        ${pages}
        <button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>›</button>
      `
      }
    </div>
  `;

  container.querySelectorAll(".page-btn[data-page]:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      render();
    });
  });
}

// ── Acciones ──────────────────────────────────────────────────

async function handleCreate() {
  const data = await openFormModal({
    title: "Nuevo Punto de Interés",
    fields: poiFields(),
    values: { status: "Pendiente", rating: 0 },
    submitLabel: "Crear POI",
  });
  if (!data) return;

  await createPoi(data);
  await refresh();
}

async function handleEdit(id) {
  const poi = allPois.find((item) => String(item.id) === String(id));
  if (!poi) return;

  const data = await openFormModal({
    title: `Editar: ${poi.name}`,
    fields: poiFields(),
    values: poi,
    submitLabel: "Guardar cambios",
  });
  if (!data) return;

  await updatePoi(id, data);
  await refresh();
}

async function handleDelete(id) {
  const poi = allPois.find((item) => String(item.id) === String(id));
  if (!poi) return;

  const confirmed = await openConfirmModal({
    title: "Eliminar POI",
    message: `¿Seguro que quieres eliminar "${poi.name}"? Esta acción no se puede deshacer y el POI desaparecerá también del mapa.`,
  });
  if (!confirmed) return;

  await deletePoi(id);
  await refresh();
}

async function handleToggle(id) {
  await togglePoiStatus(id);
  await refresh();
}

function showTableError() {
  const tbody = document.getElementById("poi-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">
    No se pudieron cargar los POIs. Inténtalo de nuevo.
  </td></tr>`;
}
