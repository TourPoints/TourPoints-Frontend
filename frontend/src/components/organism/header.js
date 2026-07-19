import { buttonLinks } from "../atoms/buttonLinks.js";
import { userMenu, initUserMenu } from "./userMenu.js";
import { isAuthenticated } from "../../services/auth.service.js";
import "../../styles/organism/header.css";

/**
 * Engancha los eventos del header. La llama el router tras insertar el HTML.
 */
export function initHeader() {
  initUserMenu();
}

export function header() {
  // Sin sesión se ofrecen los botones de entrada; con sesión sobran, porque
  // todo (incluido el panel de administración) cuelga del menú de perfil.
  const showAuthButtons = !isAuthenticated();

  // El corazón no lleva la clase .menu a propósito: updateActiveMenu pinta esa
  // clase de azul con subrayado, y aquí el estado activo es el rosa relleno.
  // El router repinta el layout en cada navegación, así que basta resolverlo
  // al renderizar, igual que hace bottomNav.
  const favoritesActive = location.pathname === "/favorites" ? " nav-favorites--active" : "";

  return `
    <header class="header-global">
      <div class="nav-container">
        <img src="/icons/isotipo_tourPoints.svg" alt="TourPoints Logo" class="logo-footer">
        <a href="/" class="logo">TourPoints</a>
        <nav class="navegation">
          <a class="menu" href="/" data-link>Inicio</a>
          <a class="menu" href="/explore" data-link>Explora</a>
          <a class="menu" href="/challenges" data-link>Retos</a>
          <a class="menu" href="/rewards" data-link>Recompensas</a>
          <a class="menu" href="/map" data-link>Mapa</a>
          <a
            class="nav-favorites${favoritesActive}"
            href="/favorites"
            data-link
            title="Mis favoritos"
            aria-label="Mis favoritos"
          >
            <i data-lucide="heart" aria-hidden="true"></i>
          </a>
        </nav>
      </div>
      <div class="header-actions">
        ${
          showAuthButtons
            ? `<div class="buttons-container">
                 ${buttonLinks("/login", "Iniciar Sesion", "secondary")}
                 ${buttonLinks("/register", "Registrarse", "primary")}
               </div>`
            : ""
        }
        ${userMenu()}
      </div>
    </header>
  `;
}
