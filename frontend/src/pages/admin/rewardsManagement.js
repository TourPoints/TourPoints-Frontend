// src/pages/admin/rewardsManagement.js
// US TOUR-39 – Gestión de Recompensas (Admin)
// Estructura base con datos mock; el backend reemplazará con la API REST.
//
// ── API ENDPOINTS esperados (backend) ────────────────────────────────────────
//   GET    /api/v1/rewards             → lista paginada de recompensas
//   POST   /api/v1/rewards             → crear recompensa
//   PUT    /api/v1/rewards/:id         → editar recompensa
//   PATCH  /api/v1/rewards/:id/status  → activar / desactivar
//   DELETE /api/v1/rewards/:id         → eliminar recompensa
// ─────────────────────────────────────────────────────────────────────────────

import { isAdmin } from "../../utils/role.js";

const MOCK_REWARDS = [
  { id: "REW-001", name: "Café gratis en Café Central", category: "Restauración", pointsCost: 150, stock: 45, status: "Activo", emoji: "☕" },
  { id: "REW-002", name: "Descuento del 10% Hotel Toledo", category: "Alojamiento", pointsCost: 500, stock: 20, status: "Activo", emoji: "🏨" },
  { id: "REW-003", name: "Entrada gratuita Museo Arte", category: "Cultura", pointsCost: 300, stock: 15, status: "Pendiente", emoji: "🎟️" },
  { id: "REW-004", name: "Guía Turística de Bolsillo", category: "Souvenirs", pointsCost: 100, stock: 120, status: "Activo", emoji: "📚" },
  { id: "REW-005", name: "Tour Nocturno de Leyendas", category: "Actividades", pointsCost: 600, stock: 8, status: "Inactivo", emoji: "🌙" }
];

const categoryBadgeClass = {
  "Restauración": "gastronomia", // reuses existing styles
  "Alojamiento":  "cultura",
  "Cultura":     "historico",
  "Souvenirs":   "default",
  "Actividades": "naturaleza"
};

function tableRows(list) {
  return list.map(r => `
    <tr data-rid="${r.id}">
      <td>
        <div class="poi-cell">
          <div class="poi-thumb">${r.emoji}</div>
          <div>
            <div class="poi-name">${r.name}</div>
            <div class="poi-id">ID: ${r.id}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${categoryBadgeClass[r.category] || 'default'}">${r.category}</span></td>
      <td><span class="points-val">${r.pointsCost} pts</span></td>
      <td><span style="font-weight: 500; color: ${r.stock < 10 ? '#ef4444' : '#334155'}">${r.stock} u.</span></td>
      <td>
        <span class="status-dot status-${r.status === 'Activo' ? 'activo' : r.status === 'Pendiente' ? 'pendiente' : 'inactivo'}">
          ${r.status}
        </span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" title="Editar" onclick="adminRewards.edit('${r.id}')">✏️</button>
          <button class="btn-icon"      title="Toggle estado" onclick="adminRewards.toggle('${r.id}')">🔄</button>
          <button class="btn-icon del"  title="Eliminar" onclick="adminRewards.delete('${r.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

export function rewardsManagement() {
  if (!isAdmin()) {
    return `
      <div class="access-denied">
        <p style="font-size:2rem">⛔</p>
        <p>Acceso denegado. Solo administradores.</p>
        <a href="#/" class="btn-primary" style="margin-top:1rem">Volver al inicio</a>
      </div>
    `;
  }

  window.adminRewards = {
    data: [...MOCK_REWARDS],

    edit(id) {
      const r = this.data.find(x => x.id === id);
      if (!r) return;
      const newName = prompt(`Editar nombre de "${r.name}":`, r.name);
      if (newName?.trim()) {
        r.name = newName.trim();
        const cell = document.querySelector(`tr[data-rid="${id}"] .poi-name`);
        if (cell) cell.textContent = r.name;
      }
    },

    toggle(id) {
      const r = this.data.find(x => x.id === id);
      if (!r) return;
      r.status = r.status === "Activo" ? "Inactivo" : "Activo";
      const cell = document.querySelector(`tr[data-rid="${id}"] .status-dot`);
      const cls  = r.status === "Activo" ? "activo" : "inactivo";
      if (cell) {
        cell.className = `status-dot status-${cls}`;
        cell.textContent = r.status;
      }
    },

    delete(id) {
      if (!confirm("¿Eliminar esta recompensa?")) return;
      this.data = this.data.filter(x => x.id !== id);
      document.querySelector(`tr[data-rid="${id}"]`)?.remove();
    },

    search(q) {
      const f = this.data.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.category.toLowerCase().includes(q.toLowerCase()));
      const tbody = document.getElementById("rewards-tbody");
      if (tbody) tbody.innerHTML = tableRows(f);
    }
  };

  return `
    <div class="admin-page-header">
      <h1 class="admin-page-title">Gestión de Recompensas</h1>
      <button class="btn-primary" onclick="alert('Formulario de nueva recompensa — pendiente de backend')">
        + Nueva Recompensa
      </button>
    </div>

    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">🎁</span><span class="stat-badge info">Total</span></div>
        <div class="stat-label">Total Recompensas</div>
        <div class="stat-value">112</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">✅</span><span class="stat-badge up">+4</span></div>
        <div class="stat-label">Recompensas Activas</div>
        <div class="stat-value">98</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">⚠️</span><span class="stat-badge new">Bajo Stock</span></div>
        <div class="stat-label">Stock < 10</div>
        <div class="stat-value">3</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">🎟️</span><span class="stat-badge up">+15%</span></div>
        <div class="stat-label">Canjeadas Hoy</div>
        <div class="stat-value">42</div>
      </div>
    </div>

    <div class="admin-table-section">
      <div class="admin-table-toolbar">
        <div class="admin-search">
          <span class="admin-search-icon">🔍</span>
          <input type="text" placeholder="Buscar recompensas..." oninput="adminRewards.search(this.value)" />
        </div>
        <button class="btn-outline">⚙️ Filtros</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Recompensa</th>
            <th>Categoría</th>
            <th>Costo Puntos</th>
            <th>Disponibles</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="rewards-tbody">
          ${tableRows(MOCK_REWARDS)}
        </tbody>
      </table>

      <div class="admin-pagination">
        <span class="pagination-info">Mostrando 1 a 5 de 112 resultados</span>
        <div class="pagination-pages">
          <button class="page-btn" disabled>‹</button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn">›</button>
        </div>
      </div>
    </div>
  `;
}
