import { buttonLinks } from "../atoms/buttonLinks.js";
import { userMenu, initUserMenu } from "./userMenu.js";
import { isAuthenticated } from "../../services/auth.service.js";
import { t, getLang, setLang } from "../../i18n/index.js";
import { renderRoute } from "../../router/router.js";
import "../../styles/organism/header.css";

/**
 * Engancha los eventos del header. La llama el router tras insertar el HTML.
 */
export function initHeader() {
  initUserMenu();
  initLangToggle();
}

/**
 * El cambio de idioma repinta la ruta entera: las páginas son template
 * strings, así que un renderRoute() tras changeLanguage deja toda la vista
 * en el idioma nuevo sin lógica extra por página.
 */
function initLangToggle() {
  document.querySelectorAll(".lang-toggle [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.lang === getLang()) return;
      setLang(btn.dataset.lang);
      renderRoute();
    });
  });
}

function langToggle() {
  const current = getLang();
  const segment = (lang) => `
    <button type="button" data-lang="${lang}"
            class="lang-toggle-btn ${lang === current ? "active" : ""}"
            aria-pressed="${lang === current}">
      ${lang.toUpperCase()}
    </button>
  `;

  return `
    <div class="lang-toggle" role="group" aria-label="${t("lang.toggleAria")}">
      ${segment("es")}${segment("en")}
    </div>
  `;
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
          <a class="menu" href="/" data-link>${t("nav.home")}</a>
          <a class="menu" href="/explore" data-link>${t("nav.explore")}</a>
          <a class="menu" href="/challenges" data-link>${t("nav.challenges")}</a>
          <a class="menu" href="/rewards" data-link>${t("nav.rewards")}</a>
          <a class="menu" href="/map" data-link>${t("nav.map")}</a>
          <a
            class="nav-favorites${favoritesActive}"
            href="/favorites"
            data-link
            title="${t("nav.favorites")}"
            aria-label="${t("nav.favorites")}"
          >
            <i data-lucide="heart" aria-hidden="true"></i>
          </a>
        </nav>
      </div>
      <div class="header-actions">
        ${langToggle()}
        ${
          showAuthButtons
            ? `<div class="buttons-container">
                 ${buttonLinks("/login", t("nav.login"), "secondary")}
                 ${buttonLinks("/register", t("nav.register"), "primary")}
               </div>`
            : ""
        }
        ${userMenu()}
      </div>
    </header>
  `;
}
