// src/pages/admin/challengesManagement.js
// US TOUR-39 – Gestión de Desafíos (Admin)

import {
  getChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  CHALLENGE_STATUSES,
} from "../../services/challenge.service.js";
import { CHALLENGE_TYPES, CHALLENGE_DIFFICULTIES } from "../../mocks/challenges.js";
import { createAdminCrudView, statusSelect, titleCell } from "./createAdminCrudView.js";
import { escapeHtml } from "../../components/organism/modal.js";
import { normalizeText } from "../../utils/text.js";
import { formatDate } from "../../utils/date.js";

const DIFFICULTY_CLASS = {
  "Fácil": "badge-diff-easy",
  "Medio": "badge-diff-med",
  "Difícil": "badge-diff-hard",
};

const { view, init } = createAdminCrudView({
  title: "Gestión de Desafíos",
  entityLabel: "Reto",
  tableId: "challenge",
  searchFields: ["name", "type", "difficulty", "status"],

  service: {
    list: getChallenges,
    create: createChallenge,
    update: updateChallenge,
    remove: deleteChallenge,
  },

  columns: [
    {
      header: "Desafío",
      // Icono fijo: un reto no tiene imagen propia, a diferencia de las
      // recompensas, donde el emoji lo elige el admin y es dato suyo.
      render: (c) =>
        titleCell({
          thumb: '<i class="thumb-icon" data-lucide="target" aria-hidden="true"></i>',
          title: c.name,
          subtitle: `ID: ${c.id}`,
        }),
    },
    {
      header: "Tipo",
      render: (c) =>
        `<span class="badge badge-${categoryClass(c.type)}">${escapeHtml(c.type)}</span>`,
    },
    {
      header: "Dificultad",
      render: (c) =>
        `<span class="badge ${DIFFICULTY_CLASS[c.difficulty] ?? ""}">${escapeHtml(c.difficulty)}</span>`,
    },
    { header: "Estado", render: (c) => statusSelect(c.status, CHALLENGE_STATUSES) },
    { header: "Puntos", render: (c) => `<span class="points-val">${escapeHtml(c.points)} pts</span>` },
    { header: "Fecha límite", render: (c) => `<span class="cell-muted">${formatDate(c.deadline)}</span>` },
  ],

  fields: () => [
    { name: "name", label: "Nombre del desafío", required: true, wide: true },
    { name: "type", label: "Tipo", type: "select", options: CHALLENGE_TYPES, required: true },
    {
      name: "difficulty",
      label: "Dificultad",
      type: "select",
      options: CHALLENGE_DIFFICULTIES,
      required: true,
    },
    { name: "status", label: "Estado", type: "select", options: CHALLENGE_STATUSES, required: true },
    { name: "points", label: "Puntos", type: "number", min: 0, required: true },
    { name: "deadline", label: "Fecha límite", type: "date", required: true, wide: true },
    { name: "image", label: "URL de la imagen", wide: true, placeholder: "https://..." },
    { name: "description", label: "Descripción", type: "textarea", wide: true },
  ],

  stats: (items) => {
    const active = items.filter((c) => c.status === "Activo").length;
    const totalPoints = items.reduce((sum, c) => sum + (Number(c.points) || 0), 0);
    return [
      { icon: "target", label: "Total Desafíos", value: items.length, badge: "En catálogo", cls: "info" },
      { icon: "circle-check", label: "Activos", value: active, badge: "En curso", cls: "up" },
      {
        icon: "clock",
        label: "Pendientes",
        value: items.filter((c) => c.status === "Pendiente").length,
        badge: "Por revisar",
        cls: "new",
      },
      {
        icon: "star",
        label: "Puntos en juego",
        value: totalPoints.toLocaleString("es-ES"),
        badge: "Total",
        cls: "info",
      },
    ];
  },
});

/** Reutiliza los colores de badge ya definidos en admin.css. */
function categoryClass(type) {
  const map = { cultural: "historico", gastronomia: "gastronomia", naturaleza: "naturaleza" };
  return map[normalizeText(type)] ?? "default";
}

export const challengesManagement = view;
export const initChallengesManagement = init;
