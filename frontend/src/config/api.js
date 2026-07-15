// Configuración de la capa HTTP.
//
// Antes este archivo estaba vacío y sin usar. services/api.client.js lee
// estos valores en vez de tocar import.meta.env directamente, así que la
// configuración del backend queda en un único sitio.

import { env } from "./enviroment.js";

export const API_BASE_URL = env.apiUrl;
export const API_TIMEOUT_MS = 8000;

/** Indica si hay un backend configurado (VITE_API_URL definida). */
export const isApiConfigured = () => Boolean(API_BASE_URL);
