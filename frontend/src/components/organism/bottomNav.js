// Barra de navegación inferior para móvil (diseño de Figma, US TOUR-35).
//
// Solo se muestra por debajo de 768px (CSS); en desktop la navegación vive
// en el header. La pestaña activa se marca al renderizar: el router repinta
// el layout en cada navegación, así que no hace falta JS adicional.

import "../../styles/organism/bottomNav.css";

const NAV_ITEMS = [
  { href: "/explore", icon: "compass", label: "Explorar" },
  { href: "/challenges", icon: "trophy", label: "Retos" },
  { href: "/rewards", icon: "gift", label: "Premios" },
  { href: "/map", icon: "map", label: "Mapa" },
];

export function bottomNav() {
  const path = location.pathname;

  return `
    <nav class="bottom-nav" aria-label="Navegación principal">
      ${NAV_ITEMS.map(
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
