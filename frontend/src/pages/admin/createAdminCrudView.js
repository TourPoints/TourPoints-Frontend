// Fábrica de vistas CRUD del panel de administración.
//
// Retos, recompensas y usuarios comparten la misma estructura: cabecera con
// acción de crear, tarjetas de métricas, buscador, tabla paginada y modales de
// edición/borrado. Se genera desde aquí para no repetir el mismo archivo tres
// veces; cada vista solo aporta sus columnas, campos y métricas.

import { openFormModal, openConfirmModal, escapeHtml } from "../../components/organism/modal.js";
import { isAdmin } from "../../utils/role.js";
import { normalizeText, debounce, includesNormalized } from "../../utils/text.js";
import { accessDenied } from "./accessDenied.js";

const ITEMS_PER_PAGE = 8;

/**
 * Crea una vista CRUD completa para una entidad del panel admin.
 * @param {Object} config - Configuración de la vista.
 * @param {string} config.title - Título de la página.
 * @param {string} config.entityLabel - Nombre singular, p.ej. "Reto".
 * @param {string} config.tableId - Prefijo único para los ids del DOM.
 * @param {Object} config.service - Servicio con list/create/update/remove/toggleStatus.
 * @param {Array<Object>} config.columns - Columnas: { header, render(item) }.
 * @param {Function} config.fields - Devuelve los campos del formulario.
 * @param {Function} config.stats - Recibe los items y devuelve las tarjetas de métricas.
 * @param {Array<string>} config.searchFields - Campos sobre los que busca el buscador.
 * @param {boolean} [config.canCreate=true] - Si se muestra el botón de crear.
 * @param {Function} [config.describe] - Texto para el modal de borrado.
 * @returns {{view: Function, init: Function}} Componente y su inicializador.
 */
export function createAdminCrudView(config) {
  const {
    title,
    entityLabel,
    tableId,
    service,
    columns,
    fields,
    stats,
    searchFields,
    canCreate = true,
    describe = (item) => item.name,
  } = config;

  // Estado propio de esta vista.
  let allItems = [];
  let visibleItems = [];
  let searchQuery = "";
  let currentPage = 1;

  const ids = {
    stats: `${tableId}-stats`,
    search: `${tableId}-search`,
    tbody: `${tableId}-tbody`,
    pagination: `${tableId}-pagination`,
    create: `${tableId}-create`,
  };

  /** Estructura HTML de la página. */
  function view() {
    if (!isAdmin()) return accessDenied();

    return `
      <div class="admin-page-header">
        <h1 class="admin-page-title">${escapeHtml(title)}</h1>
        ${
          canCreate
            ? `<button class="btn-primary" id="${ids.create}">+ Nuevo ${escapeHtml(entityLabel)}</button>`
            : ""
        }
      </div>

      <div class="admin-stats" id="${ids.stats}"></div>

      <div class="admin-table-section">
        <div class="admin-table-toolbar">
          <div class="admin-search">
            <span class="admin-search-icon">🔍</span>
            <input type="text" id="${ids.search}" placeholder="Buscar..." autocomplete="off" />
          </div>
        </div>

        <div class="admin-table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                ${columns.map((col) => `<th>${escapeHtml(col.header)}</th>`).join("")}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="${ids.tbody}">
              <tr><td colspan="${columns.length + 1}" class="admin-empty">Cargando...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="admin-pagination" id="${ids.pagination}"></div>
      </div>
    `;
  }

  /** Carga los datos y engancha los eventos. */
  async function init() {
    if (!isAdmin()) return;

    searchQuery = "";
    currentPage = 1;

    await refresh();

    document.getElementById(ids.create)?.addEventListener("click", handleCreate);

    const runSearch = debounce(() => {
      currentPage = 1;
      render();
    }, 250);

    document.getElementById(ids.search)?.addEventListener("input", (event) => {
      searchQuery = event.target.value;
      runSearch();
    });
  }

  async function refresh() {
    try {
      allItems = await service.list();
    } catch (error) {
      console.error(`Error al cargar ${title}:`, error);
      showError();
      return;
    }
    render();
  }

  function render() {
    const query = normalizeText(searchQuery);
    visibleItems = allItems.filter((item) =>
      searchFields.some((field) => includesNormalized(item[field], query))
    );

    const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    renderStats();
    renderTable();
    renderPagination(totalPages);
  }

  function renderStats() {
    const container = document.getElementById(ids.stats);
    if (!container) return;

    container.innerHTML = stats(allItems)
      .map(
        (card) => `
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-icon">${card.icon}</span>
            <span class="stat-badge ${card.cls ?? "info"}">${escapeHtml(card.badge)}</span>
          </div>
          <div class="stat-label">${escapeHtml(card.label)}</div>
          <div class="stat-value">${escapeHtml(card.value)}</div>
        </div>
      `
      )
      .join("");
  }

  function renderTable() {
    const tbody = document.getElementById(ids.tbody);
    if (!tbody) return;

    if (visibleItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${columns.length + 1}" class="admin-empty">
        No hay resultados para esta búsqueda.
      </td></tr>`;
      return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = visibleItems.slice(start, start + ITEMS_PER_PAGE);

    tbody.innerHTML = pageItems
      .map(
        (item) => `
        <tr data-id="${escapeHtml(item.id)}">
          ${columns.map((col) => `<td>${col.render(item)}</td>`).join("")}
          <td>
            <div class="actions-cell">
              <button class="btn-icon edit" title="Editar" data-action="edit">✏️</button>
              <button class="btn-icon" title="Cambiar estado" data-action="toggle">🔄</button>
              <button class="btn-icon del" title="Eliminar" data-action="delete">🗑️</button>
            </div>
          </td>
        </tr>
      `
      )
      .join("");

    const actions = { edit: handleEdit, toggle: handleToggle, delete: handleDelete };
    tbody.querySelectorAll("[data-action]").forEach((btn) => {
      const id = btn.closest("tr").dataset.id;
      btn.addEventListener("click", () => actions[btn.dataset.action](id));
    });
  }

  function renderPagination(totalPages) {
    const container = document.getElementById(ids.pagination);
    if (!container) return;

    const start = visibleItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, visibleItems.length);

    const pages =
      totalPages <= 1
        ? ""
        : `
        <button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>‹</button>
        ${Array.from(
          { length: totalPages },
          (_, i) => `
          <button class="page-btn ${i + 1 === currentPage ? "active" : ""}" data-page="${i + 1}">${i + 1}</button>`
        ).join("")}
        <button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>›</button>
      `;

    container.innerHTML = `
      <span class="pagination-info">Mostrando ${start} a ${end} de ${visibleItems.length} resultados</span>
      <div class="pagination-pages">${pages}</div>
    `;

    container.querySelectorAll(".page-btn[data-page]:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        render();
      });
    });
  }

  // ── Acciones ────────────────────────────────────────────────

  async function handleCreate() {
    const data = await openFormModal({
      title: `Nuevo ${entityLabel}`,
      fields: fields(allItems),
      submitLabel: `Crear ${entityLabel}`,
    });
    if (!data) return;

    await service.create(data);
    await refresh();
  }

  async function handleEdit(id) {
    const item = allItems.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    const data = await openFormModal({
      title: `Editar: ${describe(item)}`,
      fields: fields(allItems),
      values: item,
      submitLabel: "Guardar cambios",
    });
    if (!data) return;

    await service.update(id, data);
    await refresh();
  }

  async function handleDelete(id) {
    const item = allItems.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    const confirmed = await openConfirmModal({
      title: `Eliminar ${entityLabel}`,
      message: `¿Seguro que quieres eliminar "${describe(item)}"? Esta acción no se puede deshacer.`,
    });
    if (!confirmed) return;

    await service.remove(id);
    await refresh();
  }

  async function handleToggle(id) {
    await service.toggleStatus(id);
    await refresh();
  }

  function showError() {
    const tbody = document.getElementById(ids.tbody);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${columns.length + 1}" class="admin-empty">
      No se pudieron cargar los datos. Inténtalo de nuevo.
    </td></tr>`;
  }

  return { view, init };
}

/** Punto de estado coloreado, compartido por todas las vistas. */
export function statusDot(status) {
  return `<span class="status-dot status-${normalizeText(status)}">${escapeHtml(status)}</span>`;
}

/** Celda con miniatura (emoji o imagen) + título e identificador. */
export function titleCell({ thumb, title, subtitle }) {
  return `
    <div class="poi-cell">
      <div class="poi-thumb">${thumb}</div>
      <div>
        <div class="poi-name">${escapeHtml(title)}</div>
        <div class="poi-id">${escapeHtml(subtitle)}</div>
      </div>
    </div>
  `;
}
