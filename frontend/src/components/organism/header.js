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

  return `
    <header class="header-global">
      <div class="nav-container">
        <img src="/public/icons/isotipo_tourPoints.svg" alt="TourPoints Logo" class="logo-footer">
        <a href="/" class="logo">TourPoints</a>
        <nav class="navegation">
          <a class="menu" href="/" data-link>Inicio</a>
          <a class="menu" href="/explore" data-link>Explora</a>
          <a class="menu" href="/challenges" data-link>Retos</a>
          <a class="menu" href="/rewards" data-link>Recompensas</a>
          <a class="menu" href="/map" data-link>Mapa</a>
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
