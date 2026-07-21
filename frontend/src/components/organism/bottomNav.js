// Barra de navegación inferior para móvil (diseño de Figma, US TOUR-35).
//
// Solo se muestra por debajo de 768px (CSS); en desktop la navegación vive
// en el header. La pestaña activa se marca al renderizar: el router repinta
// el layout en cada navegación, así que no hace falta JS adicional.

import { t } from "../../i18n/index.js";
import "../../styles/organism/bottomNav.css";

// Las etiquetas se resuelven al renderizar (no en una constante de módulo):
// así el cambio de idioma las actualiza con el repintado del router.
const NAV_ITEMS = () => [
  { href: "/explore", icon: "compass", label: t("nav.bottomExplore") },
  { href: "/challenges", icon: "trophy", label: t("nav.bottomChallenges") },
  { href: "/rewards", icon: "gift", label: t("nav.bottomRewards") },
  { href: "/map", icon: "map", label: t("nav.bottomMap") },
];

export function bottomNav() {
  const path = location.pathname;

  return `
    <nav class="bottom-nav" aria-label="Navegación principal">
      ${NAV_ITEMS().map(
        (item) => `
        <a href="${item.href}" data-link
           class="bottom-nav-item ${path === item.href ? "active" : ""}">
          <i data-lucide="${item.icon}" aria-hidden="true"></i>
          <span>${item.label}</span>
        </a>
      `
      ).join("")}
    </nav>
  `;
}
