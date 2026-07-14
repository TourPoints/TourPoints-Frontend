// src/pages/admin/challengesManagement.js
// US TOUR-39 – Gestión de Desafíos (Admin)
//
// ── API ENDPOINTS esperados (backend) ────────────────────────────────────────
//   GET    /api/v1/challenges             → lista paginada de desafíos
//   POST   /api/v1/challenges             → crear desafío
//   PUT    /api/v1/challenges/:id         → editar desafío
//   PATCH  /api/v1/challenges/:id/status  → activar / desactivar
//   DELETE /api/v1/challenges/:id         → eliminar desafío
// ─────────────────────────────────────────────────────────────────────────────

import { isAdmin } from "../../utils/role.js";

const MOCK_CHALLENGES = [
  { id: "CHL-001", name: "Ruta de los Museos",     type: "Cultural",   difficulty: "Medio",   status: "Activo",    points: 500,  deadline: "31/12/2025" },
  { id: "CHL-002", name: "Gastrónomo Urbano",       type: "Gastronomía",difficulty: "Fácil",   status: "Activo",    points: 250,  deadline: "15/10/2025" },
  { id: "CHL-003", name: "Caminante del Retiro",    type: "Naturaleza", difficulty: "Fácil",   status: "Pendiente", points: 300,  deadline: "01/11/2025" },
  { id: "CHL-004", name: "Fotógrafo de Toledo",     type: "Cultural",   difficulty: "Difícil", status: "Activo",    points: 800,  deadline: "20/09/2025" },
  { id: "CHL-005", name: "Maratón de Tapas",        type: "Gastronomía",difficulty: "Medio",   status: "Inactivo",  points: 400,  deadline: "01/08/2025" },
];

const typeClass = {
  "Cultural":    "historico",
  "Gastronomía": "gastronomia",
  "Naturaleza":  "naturaleza",
};

const diffClass = {
  "Fácil":   "badge-diff-easy",
  "Medio":   "badge-diff-med",
  "Difícil": "badge-diff-hard",
};

function tableRows(list) {
  return list.map(c => `
    <tr data-cid="${c.id}">
      <td>
        <div class="poi-cell">
          <div class="poi-thumb">🏆</div>
          <div>
            <div class="poi-name">${c.name}</div>
            <div class="poi-id">ID: ${c.id}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-${typeClass[c.type] || 'default'}">${c.type}</span></td>
      <td><span class="badge ${diffClass[c.difficulty] || ''}">${c.difficulty}</span></td>
      <td>
        <span class="status-dot status-${c.status === 'Activo' ? 'activo' : c.status === 'Pendiente' ? 'pendiente' : 'inactivo'}">
          ${c.status}
        </span>
      </td>
      <td><span class="points-val">${c.points} pts</span></td>
      <td><span style="color:#94a3b8;font-size:0.82rem">${c.deadline}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" title="Editar" onclick="adminChallenges.edit('${c.id}')">✏️</button>
          <button class="btn-icon"      title="Toggle estado" onclick="adminChallenges.toggle('${c.id}')">🔄</button>
          <button class="btn-icon del"  title="Eliminar" onclick="adminChallenges.delete('${c.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

export function challengesManagement() {
  if (!isAdmin()) {
    return `
      <div class="access-denied">
        <p style="font-size:2rem">⛔</p>
        <p>Acceso denegado. Solo administradores.</p>
        <a href="/" class="btn-primary" style="margin-top:1rem">Volver al inicio</a>
      </div>
    `;
  }

  window.adminChallenges = {
    data: [...MOCK_CHALLENGES],

    edit(id) {
      const c = this.data.find(x => x.id === id);
      if (!c) return;
      const newName = prompt(`Editar nombre de "${c.name}":`, c.name);
      if (newName?.trim()) {
        c.name = newName.trim();
        document.querySelector(`tr[data-cid="${id}"] .poi-name`)?.replaceWith(
          Object.assign(document.createElement("div"), { className: "poi-name", textContent: c.name })
        );
      }
    },

    toggle(id) {
      const c = this.data.find(x => x.id === id);
      if (!c) return;
      c.status = c.status === "Activo" ? "Inactivo" : "Activo";
      const cell = document.querySelector(`tr[data-cid="${id}"] .status-dot`);
      const cls  = c.status === "Activo" ? "activo" : "inactivo";
      if (cell) { cell.className = `status-dot status-${cls}`; cell.textContent = c.status; }
    },

    delete(id) {
      if (!confirm("¿Eliminar este desafío?")) return;
      this.data = this.data.filter(x => x.id !== id);
      document.querySelector(`tr[data-cid="${id}"]`)?.remove();
    },

    search(q) {
      const f = this.data.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
      const tbody = document.getElementById("chl-tbody");
      if (tbody) tbody.innerHTML = tableRows(f);
    },
  };

  return `
    <div class="admin-page-header">
      <h1 class="admin-page-title">Gestión de Retos</h1>
      <button class="btn-primary" onclick="alert('Formulario de nuevo desafío — pendiente de backend')">
        + Nuevo Reto
      </button>
    </div>

    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">🏆</span><span class="stat-badge up">+8%</span></div>
        <div class="stat-label">Total Desafíos</div>
        <div class="stat-value">36</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">✅</span><span class="stat-badge up">+2</span></div>
        <div class="stat-label">Activos</div>
        <div class="stat-value">28</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">⏳</span><span class="stat-badge warn">–</span></div>
        <div class="stat-label">Pendientes</div>
        <div class="stat-value">5</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">📊</span><span class="stat-badge info">Avg</span></div>
        <div class="stat-label">Participación</div>
        <div class="stat-value">73%</div>
      </div>
    </div>

    <div class="admin-table-section">
      <div class="admin-table-toolbar">
        <div class="admin-search">
          <span class="admin-search-icon">🔍</span>
          <input type="text" placeholder="Buscar desafíos..." oninput="adminChallenges.search(this.value)" />
        </div>
        <button class="btn-outline">⚙️ Filtros</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Nombre del Reto</th>
            <th>Tipo</th>
            <th>Dificultad</th>
            <th>Estado</th>
            <th>Puntos</th>
            <th>Vencimiento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="chl-tbody">
          ${tableRows(MOCK_CHALLENGES)}
        </tbody>
      </table>

      <div class="admin-pagination">
        <span class="pagination-info">Mostrando 1 a 5 de 36 resultados</span>
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
