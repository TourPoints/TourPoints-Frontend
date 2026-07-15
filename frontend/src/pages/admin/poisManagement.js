// src/pages/admin/poisManagement.js
// US TOUR-40 – Gestión de Puntos de Interés (Admin)
//
// Opera sobre los mismos POIs que consumen el mapa y la vista de exploración,
// a través de poi.service.js. Lo que se cree o desactive aquí se refleja en el
// sitio público. Cuando exista el backend, solo cambia el servicio.
//
// Antes esta vista reimplementaba manualmente ~300 líneas de tabla,
// paginación, búsqueda y CRUD casi idénticas a createAdminCrudView.js (la
// misma fábrica que ya usan retos, recompensas y usuarios). Ahora se apoya
// en esa fábrica igual que las demás; solo aporta sus columnas, campos y
// métricas propias.

import {
  getAllPois,
  createPoi,
  updatePoi,
  deletePoi,
  togglePoiStatus,
  POI_STATUSES,
  PUBLISHED_STATUS,
} from "../../services/poi.service.js";
import { createAdminCrudView, statusDot, titleCell } from "./createAdminCrudView.js";
import { escapeHtml } from "../../components/organism/modal.js";
import { normalizeText } from "../../utils/text.js";
import { getCategories, ALL_CATEGORIES } from "../../utils/poiFilter.js";

/** Clase CSS del badge de categoría. */
function categoryBadge(category) {
  return `<span class="badge badge-${normalizeText(category)}">${escapeHtml(category)}</span>`;
}

/**
 * Campos del formulario de POI, compartidos por creación y edición.
 * @param {Array<Object>} items - POIs cargados, para ofrecer las categorías ya existentes.
 * @returns {Array<Object>} Definición de campos para el modal.
 */
function poiFields(items) {
  const categories = getCategories(items).filter((c) => c !== ALL_CATEGORIES);

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

const { view, init } = createAdminCrudView({
  title: "Gestión de POIs",
  entityLabel: "POI",
  tableId: "poi",
  searchFields: ["name", "description", "location", "category"],

  service: {
    list: getAllPois,
    create: createPoi,
    update: updatePoi,
    remove: deletePoi,
    toggleStatus: togglePoiStatus,
  },

  columns: [
    {
      header: "Nombre del POI",
      render: (poi) =>
        titleCell({
          thumb: `<img src="${escapeHtml(poi.image)}" alt="" loading="lazy">`,
          title: poi.name,
          subtitle: `ID: ${poi.id}`,
        }),
    },
    { header: "Categoría", render: (poi) => categoryBadge(poi.category) },
    { header: "Ubicación", render: (poi) => escapeHtml(poi.location) },
    { header: "Estado", render: (poi) => statusDot(poi.status) },
    { header: "Puntos", render: (poi) => `<span class="points-val">${escapeHtml(poi.points)} pts</span>` },
  ],

  fields: poiFields,

  stats: (items) => {
    const total = items.length;
    const active = items.filter((p) => p.status === PUBLISHED_STATUS).length;
    const pending = items.filter((p) => p.status === "Pendiente").length;
    const avgRating = total
      ? (items.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / total).toFixed(1)
      : "0.0";

    return [
      { icon: "📍", label: "Total POIs", value: total, badge: `${total} en total`, cls: "info" },
      { icon: "✅", label: "Publicados", value: active, badge: "Visibles al público", cls: "up" },
      { icon: "🕒", label: "Pendientes", value: pending, badge: "Por revisar", cls: "new" },
      { icon: "⭐", label: "Calificación Avg.", value: avgRating, badge: "Rating", cls: "info" },
    ];
  },
});

export const poisManagement = view;
export const initPoisManagement = init;
