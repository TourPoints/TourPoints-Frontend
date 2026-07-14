// src/pages/admin/poisManagement.js
// US TOUR-40 – Gestión de Puntos de Interés (Admin)
// Datos mock iniciales; el backend sustituirá estas llamadas con la API REST.
//
// ── API ENDPOINTS esperados (backend) ────────────────────────
//   GET    /api/v1/pois            → lista paginada de POIs
//   POST   /api/v1/pois            → crear nuevo POI
//   PUT    /api/v1/pois/:id        → editar POI existente
//   PATCH  /api/v1/pois/:id/status → activar / desactivar
//   DELETE /api/v1/pois/:id        → eliminar POI
// ─────────────────────────────────────────────────────────────

import { isAdmin } from "../../utils/role.js";

// ── Datos mock ────────────────────────────────────────────────
const MOCK_POIS = [
  { id: "POI-001", name: "Catedral Primada",    category: "Histórico",   location: "Toledo, España",    status: "Activo",    points: 250, emoji: "⛪" },
  { id: "POI-002", name: "Mercado de San Juan", category: "Gastronomía", location: "Madrid, España",    status: "Activo",    points: 150, emoji: "🥘" },
  { id: "POI-003", name: "Parque del Retiro",   category: "Naturaleza",  location: "Madrid, España",    status: "Pendiente", points: 300, emoji: "🌳" },
  { id: "POI-004", name: "Museo de Arte Moderno",category: "Cultura",    location: "Barcelona, España", status: "Activo",    points: 200, emoji: "🎨" },
];

// ── Helpers ───────────────────────────────────────────────────
function categoryBadge(cat) {
  const map = {
    "Histórico":   "historico",
    "Gastronomía": "gastronomia",
    "Naturaleza":  "naturaleza",
    "Cultura":     "cultura",
  };
  return `<span class="badge badge-${map[cat] || "default"}">${cat}</span>`;
}

function statusDot(status) {
  const cls = status === "Activo" ? "activo" : status === "Pendiente" ? "pendiente" : "inactivo";
  return `<span class="status-dot status-${cls}">${status}</span>`;
}

function tableRows(pois) {
  return pois.map(p => `
    <tr data-id="${p.id}">
      <td>
        <div class="poi-cell">
          <div class="poi-thumb">${p.emoji}</div>
          <div>
            <div class="poi-name">${p.name}</div>
            <div class="poi-id">ID: ${p.id}</div>
          </div>
        </div>
      </td>
      <td>${categoryBadge(p.category)}</td>
      <td>${p.location}</td>
      <td>${statusDot(p.status)}</td>
      <td><span class="points-val">${p.points} pts</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" title="Editar" onclick="adminPOI.edit('${p.id}')">✏️</button>
          <button class="btn-icon del"  title="Eliminar" onclick="adminPOI.delete('${p.id}')">🗑️</button>
          <button class="btn-icon"      title="Más opciones" onclick="adminPOI.toggle('${p.id}')">⋯</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ── Componente principal ──────────────────────────────────────
export function poisManagement() {
  if (!isAdmin()) {
    return `
      <div class="access-denied">
        <p style="font-size:2rem">⛔</p>
        <p>Acceso denegado. Solo administradores.</p>
        <a href="/" class="btn-primary" style="margin-top:1rem">Volver al inicio</a>
      </div>
    `;
  }

  // Registrar controlador global (se sustituirá por llamadas a la API)
  window.adminPOI = {
    data: [...MOCK_POIS],

    edit(id) {
      const poi = this.data.find(p => p.id === id);
      if (!poi) return;
      const newName = prompt(`Editar nombre de ${poi.name}:`, poi.name);
      if (newName && newName.trim()) {
        poi.name = newName.trim();
        document.querySelector(`tr[data-id="${id}"] .poi-name`).textContent = poi.name;
      }
    },

    delete(id) {
      if (!confirm("¿Eliminar este POI?")) return;
      this.data = this.data.filter(p => p.id !== id);
      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) row.remove();
    },

    toggle(id) {
      const poi = this.data.find(p => p.id === id);
      if (!poi) return;
      poi.status = poi.status === "Activo" ? "Inactivo" : "Activo";
      const cell = document.querySelector(`tr[data-id="${id}"] .status-dot`);
      const cls  = poi.status === "Activo" ? "activo" : "inactivo";
      if (cell) {
        cell.className = `status-dot status-${cls}`;
        cell.textContent = poi.status;
      }
    },

    search(q) {
      const filtered = this.data.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.category.toLowerCase().includes(q.toLowerCase()) ||
        p.location.toLowerCase().includes(q.toLowerCase())
      );
      const tbody = document.getElementById("poi-tbody");
      if (tbody) tbody.innerHTML = tableRows(filtered);
    },
  };

  return `
    <!-- Page header -->
    <div class="admin-page-header">
      <h1 class="admin-page-title">Gestión de POIs</h1>
      <button class="btn-primary" id="btn-nuevo-poi" onclick="adminPOI.openModal()">+ Nuevo POI</button>
    </div>

    <!-- Stats cards -->
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon">📍</span>
          <span class="stat-badge up">+12%</span>
        </div>
        <div class="stat-label">Total POIs</div>
        <div class="stat-value">1,284</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon">👁️</span>
          <span class="stat-badge up">+5%</span>
        </div>
        <div class="stat-label">Vistas Totales</div>
        <div class="stat-value">45.2k</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon">⭐</span>
          <span class="stat-badge info">Rating</span>
        </div>
        <div class="stat-label">Calificación Avg.</div>
        <div class="stat-value">4.8</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon">🚩</span>
          <span class="stat-badge new">3 nuevos</span>
        </div>
        <div class="stat-label">Reportes POI</div>
        <div class="stat-value">14</div>
      </div>
    </div>

    <!-- Table section -->
    <div class="admin-table-section">

      <!-- Toolbar: search + filter -->
      <div class="admin-table-toolbar">
        <div class="admin-search">
          <span class="admin-search-icon">🔍</span>
          <input
            type="text"
            id="poi-search"
            placeholder="Buscar puntos de interés..."
            oninput="adminPOI.search(this.value)"
          />
        </div>
        <button class="btn-outline" id="btn-filtros">⚙️ Filtros</button>
      </div>

      <!-- Table -->
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
          ${tableRows(MOCK_POIS)}
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="admin-pagination">
        <span class="pagination-info">Mostrando 1 a 4 de 1,284 resultados</span>
        <div class="pagination-pages">
          <button class="page-btn" disabled>‹</button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn" disabled>…</button>
          <button class="page-btn">128</button>
          <button class="page-btn">›</button>
        </div>
      </div>

    </div>

    <!-- Modal placeholder (backend integrará el form real) -->
    <div id="poi-modal" style="display:none"></div>
  `;
}

// Abrir modal de creación (placeholder hasta integración con API)
window.adminPOI = window.adminPOI || {};
window.adminPOI.openModal = function () {
  alert("📍 Aquí irá el formulario de creación de POI.\n(Pendiente de integración con el backend)");
};
