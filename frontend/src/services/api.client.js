// Cliente HTTP central para hablar con la API de TourPoints.
//
// Mientras el backend no existe, VITE_API_URL queda sin definir y los servicios
// siguen usando los mocks locales. Cuando el backend esté disponible basta con
// definir la variable en el .env: no hay que tocar las vistas.

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Indica si hay un backend configurado.
 * Los servicios lo consultan para decidir entre la API real y los mocks.
 * @returns {boolean}
 */
export function isApiEnabled() {
  return Boolean(BASE_URL);
}

/**
 * Error de API con el código de estado, para que las vistas puedan distinguir
 * un 404 de una caída del servidor.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Realiza una petición GET contra la API y devuelve el JSON ya parseado.
 * @param {string} path - Ruta relativa, por ejemplo "/pois".
 * @param {Object} [params] - Parámetros de query; los vacíos se descartan.
 * @param {Object} [options] - Opciones extra.
 * @param {number} [options.timeout] - Milisegundos antes de abortar.
 * @returns {Promise<any>} Cuerpo de la respuesta.
 * @throws {ApiError} Si la respuesta no es satisfactoria o expira el tiempo.
 */
export async function apiGet(path, params = {}, { timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new ApiError(`La petición a ${path} falló`, response.status);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(`La petición a ${path} superó el tiempo de espera`, 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
