// src/pages/admin/usersManagement.js
// US – Gestión de Usuarios (Admin)
// Estructura base con datos mock; el backend reemplazará con la API REST.
//
// ── API ENDPOINTS esperados (backend) ────────────────────────────────────────
//   GET    /api/v1/users              → lista paginada { data, total, page }
//   GET    /api/v1/users/:id          → detalle de usuario
//   PUT    /api/v1/users/:id          → editar usuario (nombre, email, rol)
//   PATCH  /api/v1/users/:id/status   → activar / suspender
//   DELETE /api/v1/users/:id          → eliminar usuario
// ─────────────────────────────────────────────────────────────────────────────

import { isAdmin } from "../../utils/role.js";

const MOCK_USERS = [
  { id: "USR-001", name: "Carlos Mendoza",   email: "carlos@email.com",  role: "user",  status: "Activo",    points: 1250, joined: "12/01/2025" },
  { id: "USR-002", name: "Ana Torres",       email: "ana@email.com",     role: "user",  status: "Activo",    points: 870,  joined: "03/03/2025" },
  { id: "USR-003", name: "Luis Ramírez",     email: "luis@email.com",    role: "admin", status: "Activo",    points: 3400, joined: "18/11/2024" },
  { id: "USR-004", name: "María González",   email: "maria@email.com",   role: "user",  status: "Suspendido",points: 320,  joined: "25/05/2025" },
  { id: "USR-005", name: "Pedro Sánchez",    email: "pedro@email.com",   role: "user",  status: "Activo",    points: 590,  joined: "07/06/2025" },
];

function roleBadge(role) {
  return role === "admin"
    ? `<span class="badge badge-admin">Admin</span>`
    : `<span class="badge badge-user">Usuario</span>`;
}

function statusDot(status) {
  const cls = status === "Activo" ? "activo" : "suspendido";
  return `<span class="status-dot status-${cls}">${status}</span>`;
}

function tableRows(users) {
  return users.map(u => `
    <tr data-uid="${u.id}">
      <td>
        <div class="poi-cell">
          <div class="poi-thumb user-avatar-thumb">${u.name.charAt(0)}</div>
          <div>
            <div class="poi-name">${u.name}</div>
            <div class="poi-id">${u.email}</div>
          </div>
        </div>
      </td>
      <td>${roleBadge(u.role)}</td>
      <td>${statusDot(u.status)}</td>
      <td><span class="points-val">${u.points.toLocaleString()} pts</span></td>
      <td><span style="color:#94a3b8;font-size:0.82rem">${u.joined}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" title="Editar usuario" onclick="adminUsers.edit('${u.id}')">✏️</button>
          <button class="btn-icon"      title="Cambiar estado" onclick="adminUsers.toggleStatus('${u.id}')">🔄</button>
          <button class="btn-icon del"  title="Eliminar usuario" onclick="adminUsers.delete('${u.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join("");
}

export function usersManagement() {
  if (!isAdmin()) {
    return `
      <div class="access-denied">
        <p style="font-size:2rem">⛔</p>
        <p>Acceso denegado. Solo administradores.</p>
        <a href="/admin" class="btn-primary" data-link style="margin-top:1rem">Volver al panel</a>
      </div>
    `;
  }

  window.adminUsers = {
    data: [...MOCK_USERS],

    edit(id) {
      const u = this.data.find(x => x.id === id);
      if (!u) return;
      const newName = prompt(`Editar nombre de ${u.name}:`, u.name);
      if (newName?.trim()) {
        u.name = newName.trim();
        const cell = document.querySelector(`tr[data-uid="${id}"] .poi-name`);
        if (cell) cell.textContent = u.name;
      }
    },

    toggleStatus(id) {
      const u = this.data.find(x => x.id === id);
      if (!u) return;
      u.status = u.status === "Activo" ? "Suspendido" : "Activo";
      const cell = document.querySelector(`tr[data-uid="${id}"] .status-dot`);
      const cls  = u.status === "Activo" ? "activo" : "suspendido";
      if (cell) {
        cell.className = `status-dot status-${cls}`;
        cell.textContent = u.status;
      }
    },

    delete(id) {
      if (!confirm("¿Eliminar este usuario permanentemente?")) return;
      this.data = this.data.filter(x => x.id !== id);
      document.querySelector(`tr[data-uid="${id}"]`)?.remove();
    },

    search(q) {
      const f = this.data.filter(u =>
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase())
      );
      const tbody = document.getElementById("users-tbody");
      if (tbody) tbody.innerHTML = tableRows(f);
    },
  };

  return `
    <!-- Header -->
    <div class="admin-page-header">
      <h1 class="admin-page-title">Gestión de Usuarios</h1>
      <button class="btn-primary" onclick="alert('Formulario de invitación pendiente de integración con backend')">
        + Invitar Usuario
      </button>
    </div>

    <!-- Stats -->
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">👥</span><span class="stat-badge up">+3%</span></div>
        <div class="stat-label">Total Usuarios</div>
        <div class="stat-value">8,430</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">✅</span><span class="stat-badge up">+1%</span></div>
        <div class="stat-label">Usuarios Activos</div>
        <div class="stat-value">7,810</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">🚫</span><span class="stat-badge warn">–</span></div>
        <div class="stat-label">Suspendidos</div>
        <div class="stat-value">620</div>
      </div>
      <div class="stat-card">
        <div class="stat-top"><span class="stat-icon">🆕</span><span class="stat-badge new">Esta semana</span></div>
        <div class="stat-label">Nuevos</div>
        <div class="stat-value">47</div>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-table-section">
      <div class="admin-table-toolbar">
        <div class="admin-search">
          <span class="admin-search-icon">🔍</span>
          <input type="text" placeholder="Buscar usuarios..." oninput="adminUsers.search(this.value)" />
        </div>
        <button class="btn-outline">⚙️ Filtros</button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Puntos</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="users-tbody">
          ${tableRows(MOCK_USERS)}
        </tbody>
      </table>

      <div class="admin-pagination">
        <span class="pagination-info">Mostrando 1 a 5 de 8,430 resultados</span>
        <div class="pagination-pages">
          <button class="page-btn" disabled>‹</button>
          <button class="page-btn active">1</button>
          <button class="page-btn">2</button>
          <button class="page-btn">3</button>
          <button class="page-btn" disabled>…</button>
          <button class="page-btn">1,686</button>
          <button class="page-btn">›</button>
        </div>
      </div>
    </div>
  `;
}
