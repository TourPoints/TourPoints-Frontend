// Configuración de la capa HTTP.
//
// Antes este archivo estaba vacío y sin usar. services/api.client.js lee
// estos valores en vez de tocar import.meta.env directamente, así que la
// configuración del backend queda en un único sitio.

import { env } from "./enviroment.js";

export const API_BASE_URL = env.apiUrl;
export const API_TIMEOUT_MS = 8000;

// El backend crece por fases (hoy solo expone /auth y /users), así que el
// interruptor no puede ser global: si con VITE_API_URL definida TODOS los
// servicios fueran al servidor, Explora y el Mapa pedirían un GET /poi que
// aún no existe y la app entera parecería rota.
//
// Cada módulo se "cablea" añadiéndolo aquí en su propio commit, cuando su
// servicio ya habla el contrato real (ver docs/CABLEADO.md). Los que no
// están en la lista siguen usando los mocks de localStorage aunque haya URL.
export const API_MODULES = new Set(["auth", "pois", "reviews"]);

/**
 * Indica si un módulo debe hablar con el backend real.
 * @param {string} [module] - Módulo a consultar ("auth", "pois", ...). Sin
 *   argumento solo comprueba que exista URL (uso interno del cliente HTTP).
 * @returns {boolean}
 */
export const isApiConfigured = (module) =>
  Boolean(API_BASE_URL) && (module === undefined || API_MODULES.has(module));
