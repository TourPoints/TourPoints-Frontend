// src/components/organism/sidebar.js
// Sidebar del panel de administración.
// Admin-only: el guard de rol está en cada página.

import { isAdmin } from "../../utils/role.js";
import "../../styles/pages/admin.css";

// Logout disponible globalmente para el onclick del botón
window.handleAdminLogout = function () {
  if (confirm("¿Cerrar sesión?")) {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    window.location.href = "/";
  }
};

export function sidebar() {
  const path = location.pathname;

  const link = (href, icon, label) => {
    const active = path === href || path.startsWith(href + "/") ? " active" : "";
    // Evitar que /admin/ active también /admin/pois etc. si href es exacto /admin
    const isExact = href === "/admin";
    const isActiveExact = isExact ? (path === "/admin") : (path === href || path.startsWith(href + "/"));
    const cls = isActiveExact ? " active" : "";
    return `<a class="sidebar-link${cls}" href="${href}" data-link>
      <span class="s-icon">${icon}</span>
      <span>${label}</span>
    </a>`;
  };

  return `
    <nav class="sidebar">

      <div class="sidebar-brand">
        <span class="sidebar-brand-title">Admin Panel</span>
        <span class="sidebar-brand-sub">TourPoints Management</span>
      </div>

      <div class="sidebar-nav">
        ${link("/admin",             "⊞",  "Dashboard")}
        ${link("/admin/users",       "👥", "Usuarios")}
        ${link("/admin/pois",        "📍", "Puntos de Interés")}
        ${link("/admin/challenges",  "🏆", "Retos")}
        ${link("/admin/rewards",     "🎁", "Recompensas")}
        ${link("/admin/settings",    "⚙️", "Configuración")}
      </div>

      <div class="sidebar-user">
        <div class="sidebar-user-avatar">AU</div>
        <div>
          <span class="sidebar-user-name">Admin User</span>
          <span class="sidebar-user-role">Master Control</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <button class="sidebar-logout" onclick="handleAdminLogout()">
          🚪 Cerrar sesión
        </button>
      </div>

    </nav>
  `;
}
