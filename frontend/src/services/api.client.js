// Cliente HTTP central para hablar con la API de TourPoints.
//
// Mientras el backend no cubre un módulo, VITE_API_URL o API_MODULES lo dejan
// en mocks locales y los servicios ni se enteran. Cuando el módulo se cablea
// (ver docs/CABLEADO.md) basta con añadirlo a API_MODULES: no hay que tocar
// las vistas.
//
// El token JWT vive aquí y viaja solo: cualquier petición lo adjunta como
// Authorization: Bearer si existe. Los servicios nunca manipulan cabeceras.

import { API_BASE_URL, API_TIMEOUT_MS, isApiConfigured } from "../config/api.js";

const BASE_URL = API_BASE_URL;
const DEFAULT_TIMEOUT_MS = API_TIMEOUT_MS;

// Mismo prefijo que el resto del almacenamiento: así el borrado por cambio de
// SEED_VERSION también cierra la sesión del backend, igual que hace con la
// sesión local (la lección de utils/role.js: una clave sin prefijo sobrevive
// al borrado y deja estados imposibles).
const TOKEN_KEY = "tourpoints:token";

/**
 * Indica si un módulo debe hablar con el backend real.
 * Los servicios lo consultan para decidir entre la API y los mocks.
 * @param {string} [module] - "auth", "pois", "challenges"...
 * @returns {boolean}
 */
export function isApiEnabled(module) {
  return isApiConfigured(module);
}

/** Guarda el JWT emitido por POST /auth/login. */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** @returns {string|null} El JWT vigente, o null si no hay sesión de API. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Olvida el JWT (logout, o token rechazado por el servidor). */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Error de API con el código de estado, para que las vistas puedan distinguir
 * un 404 de una caída del servidor. `detail` conserva el cuerpo de error de
 * FastAPI: los 4xx de negocio traen ahí el mensaje descriptivo.
 */
export class ApiError extends Error {
  constructor(message, status, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Petición base contra la API. Los verbos exportados delegan aquí.
 * @param {string} path - Ruta relativa, por ejemplo "/auth/login".
 * @param {Object} [options]
 * @param {string} [options.method="GET"]
 * @param {Object} [options.params] - Query params; los vacíos se descartan.
 * @param {Object} [options.body] - Cuerpo a serializar como JSON.
 * @param {number} [options.timeout] - Milisegundos antes de abortar.
 * @returns {Promise<any>} Cuerpo de la respuesta ya parseado (null si 204).
 * @throws {ApiError} Si la respuesta no es satisfactoria o expira el tiempo.
 */
async function request(path, { method = "GET", params = {}, body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      // FastAPI describe sus errores en `detail`: un texto en los 4xx de
      // negocio, una lista de campos en los 422 de validación.
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(`La petición a ${path} falló`, response.status, errorBody?.detail ?? null);
    }

    if (response.status === 204) return null;
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

/**
 * GET contra la API, con un único reintento ante fallo transitorio.
 *
 * El backend en Neon cierra conexiones ociosas y su pool aún no lo detecta
 * (les está sugerido pool_pre_ping): la primera petición tras un rato de
 * calma puede morir con un 500 de "SSL connection has been closed". Un solo
 * reintento absorbe ese caso sin enmascarar errores reales, y solo en GET,
 * que es idempotente — jamás reintentar un POST.
 *
 * @param {string} path - Ruta relativa, por ejemplo "/poi".
 * @param {Object} [params] - Parámetros de query.
 * @param {Object} [options] - Opciones extra ({ timeout }).
 */
export async function apiGet(path, params = {}, options = {}) {
  try {
    return await request(path, { ...options, params });
  } catch (error) {
    const transitorio =
      error instanceof TypeError ||
      (error instanceof ApiError && (error.status === 500 || error.status === 408));
    if (!transitorio) throw error;
    return request(path, { ...options, params });
  }
}

/**
 * GET de una lista paginada: desenvuelve el sobre {items, total, ...} del
 * backend y devuelve directamente el array, que es lo que las vistas esperan.
 * page_size va al máximo que aceptan (100): a la escala actual del catálogo
 * trae todo, y el filtrado/paginación de las vistas sigue en cliente.
 */
export async function apiGetItems(path, params = {}, options = {}) {
  const res = await apiGet(path, { page_size: 100, ...params }, options);
  return Array.isArray(res) ? res : res?.items ?? [];
}

/** POST con cuerpo JSON. */
export function apiPost(path, body, options = {}) {
  return request(path, { ...options, method: "POST", body });
}

/** PATCH con cuerpo JSON (el backend usa PATCH para ediciones parciales). */
export function apiPatch(path, body, options = {}) {
  return request(path, { ...options, method: "PATCH", body });
}

/** PUT con cuerpo JSON (calificaciones idempotentes, según su contrato). */
export function apiPut(path, body, options = {}) {
  return request(path, { ...options, method: "PUT", body });
}

/** DELETE. Devuelve null en el 204 habitual. */
export function apiDelete(path, options = {}) {
  return request(path, { ...options, method: "DELETE" });
}
