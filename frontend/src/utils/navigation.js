import { navigate } from "../router/router.js";

// Ayuda de navegación hacia atrás.
//
// "Volver" significa dos cosas distintas según cómo se llegó a la vista:
// si el usuario venía de Explora o del Mapa, lo natural es deshacer esa
// navegación y devolverlo a la lista con su scroll y sus filtros intactos.
// Pero si abrió la URL directamente (enlace compartido, marcador, recarga)
// no hay nada propio a lo que volver: history.back() lo sacaría del sitio.
//
// El router marca cada navegación interna con history.pushState({}, ...),
// así que un state no nulo significa "esta entrada la creamos nosotros".
// En una carga en frío el state es null y usamos la ruta de respaldo.

/**
 * Vuelve a la vista anterior si se llegó navegando dentro de la app;
 * si no, va a la ruta de respaldo.
 * @param {string} fallbackPath - Ruta a la que ir si no hay historial propio.
 */
export function goBackOr(fallbackPath) {
  if (window.history.state !== null) {
    window.history.back();
    return;
  }

  navigate(fallbackPath);
}
