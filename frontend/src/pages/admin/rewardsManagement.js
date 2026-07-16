// src/pages/admin/rewardsManagement.js
// US TOUR-39 – Gestión de Recompensas (Admin)

import {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  toggleRewardStatus,
  REWARD_STATUSES,
} from "../../services/reward.service.js";
import { REWARD_CATEGORIES } from "../../mocks/rewards.js";
import { createAdminCrudView, statusDot, titleCell } from "./createAdminCrudView.js";
import { escapeHtml } from "../../components/organism/modal.js";

// Reutiliza los colores de badge ya definidos en admin.css.
const CATEGORY_CLASS = {
  "Restauración": "gastronomia",
  "Alojamiento": "cultura",
  "Cultura": "historico",
  "Souvenirs": "default",
  "Actividades": "naturaleza",
};

/** El stock bajo se resalta para que el admin lo detecte de un vistazo. */
function stockCell(stock) {
  const low = Number(stock) <= 10;
  return `<span class="points-val ${low ? "stock-low" : ""}">${escapeHtml(stock)} uds</span>`;
}

const { view, init } = createAdminCrudView({
  title: "Gestión de Recompensas",
  entityLabel: "Recompensa",
  tableId: "reward",
  searchFields: ["name", "category", "status"],

  service: {
    list: getRewards,
    create: createReward,
    update: updateReward,
    remove: deleteReward,
    toggleStatus: toggleRewardStatus,
  },

  columns: [
    {
      header: "Recompensa",
      render: (r) => titleCell({ thumb: r.emoji ?? "🎁", title: r.name, subtitle: `ID: ${r.id}` }),
    },
    {
      header: "Categoría",
      render: (r) =>
        `<span class="badge badge-${CATEGORY_CLASS[r.category] ?? "default"}">${escapeHtml(r.category)}</span>`,
    },
    {
      header: "Coste",
      render: (r) => `<span class="points-val">${escapeHtml(r.pointsCost)} pts</span>`,
    },
    { header: "Stock", render: (r) => stockCell(r.stock) },
    { header: "Estado", render: (r) => statusDot(r.status) },
  ],

  fields: () => [
    { name: "name", label: "Nombre de la recompensa", required: true, wide: true },
    {
      name: "category",
      label: "Categoría",
      type: "select",
      options: REWARD_CATEGORIES,
      required: true,
    },
    { name: "status", label: "Estado", type: "select", options: REWARD_STATUSES, required: true },
    { name: "pointsCost", label: "Coste en puntos", type: "number", min: 0, required: true },
    { name: "stock", label: "Stock disponible", type: "number", min: 0, required: true },
    { name: "emoji", label: "Icono (emoji)", placeholder: "🎁" },
    { name: "image", label: "URL de la imagen", wide: true, placeholder: "https://..." },
    { name: "description", label: "Descripción", type: "textarea", wide: true },
  ],

  stats: (items) => {
    const active = items.filter((r) => r.status === "Activo").length;
    const lowStock = items.filter((r) => Number(r.stock) <= 10).length;
    const totalStock = items.reduce((sum, r) => sum + (Number(r.stock) || 0), 0);
    return [
      { icon: "ticket", label: "Total Recompensas", value: items.length, badge: "En catálogo", cls: "info" },
      { icon: "circle-check", label: "Activas", value: active, badge: "Canjeables", cls: "up" },
      { icon: "triangle-alert", label: "Stock bajo", value: lowStock, badge: "10 o menos", cls: "new" },
      {
        icon: "package",
        label: "Stock total",
        value: totalStock.toLocaleString("es-ES"),
        badge: "Unidades",
        cls: "info",
      },
    ];
  },
});

export const rewardsManagement = view;
export const initRewardsManagement = init;
