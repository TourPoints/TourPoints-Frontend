// Menú del botón de perfil del header.
//
// Es el único punto de entrada al panel de administración desde la interfaz:
// antes no existía ningún enlace y solo se llegaba escribiendo la URL.
// El contenido se adapta a la sesión: sin sesión invita a entrar o registrarse;
// con sesión muestra la cuenta y, si es admin, los accesos al panel.
//
// Los iconos repiten los del destino al que llevan: el corazón es el mismo de
// favoritos en la barra de navegación, y gauge/users-round/ticket/log-out son
// los mismos de la barra lateral del panel. Un mismo sitio no puede tener dos
// iconos según desde dónde se mire.

import { getCurrentUser, logout } from "../../services/auth.service.js";
import { openConfirmModal, escapeHtml } from "./modal.js";
import { navigate } from "../../router/router.js";
import "../../styles/organism/userMenu.css";

/**
 * Iniciales del usuario para el avatar.
 * @param {string} name - Nombre completo.
 * @returns {string} Una o dos iniciales en mayúscula.
 */
function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * HTML del botón de perfil y su menú desplegable.
 * @returns {string}
 */
export function userMenu() {
  const user = getCurrentUser();

  return `
    <div class="user-menu" id="user-menu">
      <button
        class="user-menu-trigger ${user ? "is-authenticated" : ""}"
        id="user-menu-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="user-menu-dropdown"
        aria-label="${user ? `Cuenta de ${escapeHtml(user.name)}` : "Cuenta"}"
      >
        ${
          user
            ? `<span class="user-menu-avatar" aria-hidden="true">${escapeHtml(initials(user.name))}</span>`
            : `<i data-lucide="circle-user-round" aria-hidden="true"></i>`
        }
      </button>

      <div class="user-menu-dropdown" id="user-menu-dropdown" role="menu" hidden>
        ${user ? authenticatedItems(user) : anonymousItems()}
      </div>
    </div>
  `;
}

/** Contenido del menú cuando no hay sesión. */
function anonymousItems() {
  return `
    <div class="user-menu-header">
      <span class="user-menu-title">¿Ya nos conoces?</span>
      <span class="user-menu-sub">Entra para guardar lugares y sumar puntos.</span>
    </div>
    <div class="user-menu-section">
      <a href="/login" class="user-menu-item user-menu-item--primary" data-link role="menuitem">
        <i class="user-menu-icon" data-lucide="log-in" aria-hidden="true"></i>
        <span>Iniciar sesión</span>
      </a>
      <a href="/register" class="user-menu-item" data-link role="menuitem">
        <i class="user-menu-icon" data-lucide="user-plus" aria-hidden="true"></i>
        <span>Crear cuenta</span>
      </a>
    </div>
  `;
}

/** Contenido del menú cuando hay sesión abierta. */
function authenticatedItems(user) {
  const isAdminUser = user.role === "admin";

  return `
    <div class="user-menu-header">
      <div class="user-menu-identity">
        <span class="user-menu-avatar user-menu-avatar--lg" aria-hidden="true">
          ${escapeHtml(initials(user.name))}
        </span>
        <div class="user-menu-identity-text">
          <span class="user-menu-title">${escapeHtml(user.name)}</span>
          <span class="user-menu-sub">${escapeHtml(user.email)}</span>
        </div>
      </div>
      <div class="user-menu-meta">
        ${isAdminUser ? `<span class="user-menu-badge">Administrador</span>` : ""}
        <span class="user-menu-points">${(Number(user.points) || 0).toLocaleString("es-ES")} pts</span>
      </div>
    </div>

    ${
      isAdminUser
        ? `
      <div class="user-menu-section">
        <span class="user-menu-section-title">Administración</span>
        <a href="/admin" class="user-menu-item user-menu-item--primary" data-link role="menuitem">
          <i class="user-menu-icon" data-lucide="gauge" aria-hidden="true"></i>
          <span>Panel de administración</span>
        </a>
        <a href="/admin/users" class="user-menu-item" data-link role="menuitem">
          <i class="user-menu-icon" data-lucide="users-round" aria-hidden="true"></i>
          <span>Gestión de usuarios</span>
        </a>
      </div>
    `
        : ""
    }

    <div class="user-menu-section">
      <a href="/favorites" class="user-menu-item" data-link role="menuitem">
        <i class="user-menu-icon" data-lucide="heart" aria-hidden="true"></i>
        <span>Mis favoritos</span>
      </a>
      <a href="/rewards" class="user-menu-item" data-link role="menuitem">
        <i class="user-menu-icon" data-lucide="ticket" aria-hidden="true"></i>
        <span>Mis recompensas</span>
      </a>
      <button class="user-menu-item user-menu-item--danger" id="user-menu-logout" type="button" role="menuitem">
        <i class="user-menu-icon" data-lucide="log-out" aria-hidden="true"></i>
        <span>Cerrar sesión</span>
      </button>
    </div>
  `;
}

/**
 * Engancha los eventos del menú. La llama el router tras insertar el header.
 */
export function initUserMenu() {
  const root = document.getElementById("user-menu");
  const trigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-menu-dropdown");
  if (!root || !trigger || !dropdown) return;

  const isOpen = () => trigger.getAttribute("aria-expanded") === "true";

  const open = () => {
    dropdown.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onKeydown);
  };

  const close = () => {
    dropdown.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onClickOutside);
    document.removeEventListener("keydown", onKeydown);
  };

  function onClickOutside(event) {
    if (!root.contains(event.target)) close();
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      close();
      trigger.focus();
    }
  }

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    isOpen() ? close() : open();
  });

  // Los enlaces del menú los navega el router; solo hay que cerrar el panel.
  dropdown.querySelectorAll("[data-link]").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.getElementById("user-menu-logout")?.addEventListener("click", async () => {
    close();

    const confirmed = await openConfirmModal({
      title: "Cerrar sesión",
      message: "¿Seguro que quieres salir de tu cuenta?",
      confirmLabel: "Cerrar sesión",
    });
    if (!confirmed) return;

    logout();
    navigate("/");
  });
}
