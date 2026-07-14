import { routes, dynamicRoutes, notFoundView } from "./routes.js";
import { renderLayout } from "./layouts.js";
import { loadIcons } from "../utils/icons.js";
import { updateActiveMenu } from "../utils/activeMenu.js";

const app = document.getElementById("app");

// ── Navega usando History API (sin #) ──────────────────────
export function navigate(path) {
  history.pushState({}, "", path);
  renderRoute();
}

export function renderRoute(){

    const path = location.pathname;

    let route = routes[path];
    let params = {};

    if (!route) {
        for (const dynRoute of dynamicRoutes) {
            const match = path.match(dynRoute.pattern);
            if (match) {
                route = dynRoute;
                params = dynRoute.parseParams(match);
                break;
            }
        }
    }

  if (!route) {
    app.innerHTML = renderLayout("public", notFoundView());
    loadIcons();
    return;
  }

  const page = route.component();
  app.innerHTML = renderLayout(route.layout, page);

    updateActiveMenu();

    loadIcons();
    if (route.init) {
        route.init(params);
    }

}

// Botón atrás / adelante del navegador
window.addEventListener("popstate", renderRoute);

// Render inicial
renderRoute();

// Interceptar clics en data-link
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (!link) return;
  e.preventDefault();
  navigate(link.getAttribute("href"));
});