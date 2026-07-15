// src/pages/admin/dashboard.js
// Panel principal del administrador: resumen calculado de los datos reales.

import { getAllPois, PUBLISHED_STATUS } from "../../services/poi.service.js";
import { isAdmin } from "../../utils/role.js";
import { escapeHtml } from "../../components/organism/modal.js";
import { accessDenied } from "./accessDenied.js";

/**
 * Retorna la estructura HTML del dashboard. Las métricas las rellena initAdminDashboard.
 */
export function adminDashboard() {
  if (!isAdmin()) return accessDenied();

  return `
    <div class="admin-content">
      <div class="admin-page-header">
        <div>
          <h1 class="admin-title">Dashboard</h1>
          <p class="admin-subtitle">Resumen general de TourPoints</p>
        </div>
      </div>

      <div class="admin-stats" id="dashboard-stats">
        <div class="admin-empty">Calculando métricas...</div>
      </div>

      <!-- Accesos rápidos: rutas reales del History API, sin hash -->
      <div class="admin-dash-cards">
        <a href="/admin/pois" class="admin-dash-card" data-link>
          <span class="dash-card-icon">📍</span>
          <span class="dash-card-title">Puntos de Interés</span>
          <span class="dash-card-desc">Crear, editar y gestionar POIs</span>
        </a>
        <a href="/admin/challenges" class="admin-dash-card" data-link>
          <span class="dash-card-icon">🏆</span>
          <span class="dash-card-title">Desafíos</span>
          <span class="dash-card-desc">Gestionar retos para turistas</span>
        </a>
        <a href="/admin/rewards" class="admin-dash-card" data-link>
          <span class="dash-card-icon">🎁</span>
          <span class="dash-card-title">Recompensas</span>
          <span class="dash-card-desc">Administrar el programa de puntos</span>
        </a>
        <a href="/admin/users" class="admin-dash-card" data-link>
          <span class="dash-card-icon">👥</span>
          <span class="dash-card-title">Usuarios</span>
          <span class="dash-card-desc">Consultar y moderar cuentas</span>
        </a>
      </div>
    </div>
  `;
}

/**
 * Calcula y pinta las métricas a partir de los servicios.
 */
export async function initAdminDashboard() {
  if (!isAdmin()) return;

  const container = document.getElementById("dashboard-stats");
  if (!container) return;

  let pois = [];
  try {
    pois = await getAllPois();
  } catch (error) {
    console.error("Error al cargar las métricas del dashboard:", error);
    container.innerHTML = `<div class="admin-empty">No se pudieron cargar las métricas.</div>`;
    return;
  }

  const published = pois.filter((poi) => poi.status === PUBLISHED_STATUS).length;
  const pending = pois.filter((poi) => poi.status === "Pendiente").length;
  const totalPoints = pois.reduce((sum, poi) => sum + (Number(poi.points) || 0), 0);

  const cards = [
    { icon: "📍", label: "Total POIs", value: pois.length, badge: "En catálogo", cls: "info" },
    { icon: "✅", label: "Publicados", value: published, badge: "Visibles al público", cls: "up" },
    { icon: "🕒", label: "Pendientes", value: pending, badge: "Por revisar", cls: "new" },
    {
      icon: "⭐",
      label: "Puntos en juego",
      value: totalPoints.toLocaleString("es-ES"),
      badge: "Total",
      cls: "info",
    },
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
