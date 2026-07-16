// src/components/organism/sidebar.js
// Sidebar del panel de administración.
// Admin-only: el guard de rol está en cada página.

import { getCurrentUser, logout } from "../../services/auth.service.js";
import { openConfirmModal, escapeHtml } from "./modal.js";
import "../../styles/pages/admin.css";

/**
 * Bloque de identidad del administrador con los datos reales de la sesión.
 * @returns {string} HTML del bloque.
 */
function sidebarUser() {
  const user = getCurrentUser();
  if (!user) return "";

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return `
    <div class="sidebar-user">
      <div class="sidebar-user-avatar">${escapeHtml(initials)}</div>
      <div>
        <span class="sidebar-user-name">${escapeHtml(user.name)}</span>
        <span class="sidebar-user-role">${escapeHtml(user.email)}</span>
      </div>
    </div>
  `;
}

/**
 * Cierra la sesión del administrador previa confirmación.
 * Lo engancha initSidebar; no se expone en window.
 */
async function handleAdminLogout() {
  const confirmed = await openConfirmModal({
    title: "Cerrar sesión",
    message: "¿Seguro que quieres salir del panel de administración?",
    confirmLabel: "Cerrar sesión",
  });
  if (!confirmed) return;

  logout();
  window.location.href = "/";
}

/**
 * Engancha los eventos del sidebar. La llama el layout tras insertar el HTML.
 */
export function initSidebar() {
  document.getElementById("sidebar-logout")?.addEventListener("click", handleAdminLogout);
}

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

        <!-- Salir del panel sin cerrar sesión. Va aquí, cerrando la navegación,
             y no en el pie junto al logout: son gestos distintos. Este te
             devuelve al sitio con la sesión intacta; el otro te echa. Con
             contorno propio para que no se lea como un séptimo enlace. -->
        <a class="sidebar-back" href="/" data-link title="Volver al sitio público">
          <span class="sidebar-back-arrow" aria-hidden="true">←</span>
          <span class="sidebar-back-label">Volver al sitio</span>
        </a>
      </div>

      ${sidebarUser()}

      <div class="sidebar-footer">
        <button class="sidebar-logout" id="sidebar-logout" type="button">
          <span class="sidebar-logout-icon" aria-hidden="true">🚪</span>
          <span class="sidebar-logout-label">Cerrar sesión</span>
          <span class="sidebar-logout-arrow" aria-hidden="true">→</span>
        </button>
      </div>

    </nav>
  `;
}
