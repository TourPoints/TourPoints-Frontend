// src/pages/admin/dashboard.js
import { isAdmin } from "../../utils/role.js";

export function adminDashboard() {
  if (!isAdmin()) {
    return `
      <div class="access-denied">
        <p style="font-size:2rem">⛔</p>
        <p>Acceso denegado. Solo administradores.</p>
        <a href="/" class="btn-primary" style="margin-top:1rem">Volver al inicio</a>
      </div>
    `;
  }

  return `
    <div class="admin-content">
      <div class="admin-page-header">
        <div>
          <h1 class="admin-title">Dashboard</h1>
          <p class="admin-subtitle">Resumen general de TourPoints</p>
        </div>
      </div>

      <!-- Stats generales -->
      <div class="admin-stats">
        <div class="stat-card">
          <div class="stat-top"><span class="stat-icon">📍</span><span class="stat-badge up">+12%</span></div>
          <div class="stat-label">Total POIs</div>
          <div class="stat-value">1,284</div>
        </div>
        <div class="stat-card">
          <div class="stat-top"><span class="stat-icon">🏆</span><span class="stat-badge up">+8%</span></div>
          <div class="stat-label">Desafíos Activos</div>
          <div class="stat-value">36</div>
        </div>
        <div class="stat-card">
          <div class="stat-top"><span class="stat-icon">🎁</span><span class="stat-badge info">Total</span></div>
          <div class="stat-label">Recompensas</div>
          <div class="stat-value">112</div>
        </div>
        <div class="stat-card">
          <div class="stat-top"><span class="stat-icon">👤</span><span class="stat-badge new">3 nuevos</span></div>
          <div class="stat-label">Usuarios</div>
          <div class="stat-value">8,430</div>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <div class="admin-dash-cards">
        <a href="#/admin/pois" class="admin-dash-card" data-link>
          <span class="dash-card-icon">📍</span>
          <span class="dash-card-title">Puntos de Interés</span>
          <span class="dash-card-desc">Crear, editar y gestionar POIs</span>
        </a>
        <a href="#/admin/challenges" class="admin-dash-card" data-link>
          <span class="dash-card-icon">🏆</span>
          <span class="dash-card-title">Desafíos</span>
          <span class="dash-card-desc">Gestionar retos para turistas</span>
        </a>
        <a href="#/admin/rewards" class="admin-dash-card" data-link>
          <span class="dash-card-icon">🎁</span>
          <span class="dash-card-title">Recompensas</span>
          <span class="dash-card-desc">Administrar el programa de puntos</span>
        </a>
      </div>
    </div>
  `;
}
