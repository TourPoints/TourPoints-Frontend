import { mockUsers } from "../mocks/users.js";
import { readCollection } from "./localStore.js";
import { createUser } from "./user.service.js";
import { setRole, clearRole } from "../utils/role.js";
import { normalizeText } from "../utils/text.js";

// Servicio de sesión.
//
// ⚠️ MODO DEMO: mientras no exista backend, la "autenticación" solo comprueba
// que el email exista entre los usuarios registrados. No hay contraseñas a
// propósito: guardarlas en el frontend sería inseguro y validarlas en el
// navegador no aporta ninguna garantía real.
//
// El día que exista backend, este archivo es el único que cambia:
//   POST /auth/login    → { token, user }
//   POST /auth/register → { token, user }
//   POST /auth/logout
// El token pasará a guardarse aquí y la autorización la aplicará el servidor
// en cada endpoint. El rol en localStorage deja de ser fuente de verdad.

const SESSION_KEY = "tourpoints:session";

/**
 * Devuelve el usuario de la sesión actual.
 * @returns {Object|null} Usuario, o null si no hay sesión.
 */
export function getCurrentUser() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Indica si hay una sesión abierta.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Inicia sesión buscando el email entre los usuarios registrados.
 * @param {string} email - Email introducido.
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>} Resultado.
 */
export async function login(email) {
  const users = readCollection("users", mockUsers);
  const target = normalizeText(email);

  const user = users.find((item) => normalizeText(item.email) === target);

  if (!user) {
    return { ok: false, error: "No encontramos ninguna cuenta con ese email." };
  }

  if (user.status === "Suspendido") {
    return { ok: false, error: "Esta cuenta está suspendida. Contacta con un administrador." };
  }

  startSession(user);
  return { ok: true, user };
}

/**
 * Registra una cuenta nueva y abre sesión con ella.
 * @param {Object} data - Datos del formulario.
 * @param {string} data.name - Nombre completo.
 * @param {string} data.email - Email.
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>} Resultado.
 */
export async function register({ name, email }) {
  const users = readCollection("users", mockUsers);
  const target = normalizeText(email);

  if (users.some((item) => normalizeText(item.email) === target)) {
    return { ok: false, error: "Ya existe una cuenta con ese email." };
  }

  // Se crea a través del servicio de usuarios para que el alta aparezca
  // también en el panel de administración.
  const user = await createUser({
    name,
    email,
    role: "user",
    status: "Activo",
    points: 0,
    joined: new Date().toISOString().slice(0, 10),
  });

  startSession(user);
  return { ok: true, user };
}

/** Cierra la sesión actual. */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
  clearRole();
}

/**
 * Guarda la sesión y sincroniza el rol que consultan el router y las vistas.
 * @param {Object} user - Usuario autenticado.
 */
function startSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  setRole(user.role);
}

/**
 * Emails de ejemplo que se muestran en el formulario de acceso.
 * Existen solo mientras no haya backend, para poder entrar sin consola.
 * @returns {{admin: Object|undefined, user: Object|undefined}}
 */
export function getDemoAccounts() {
  const users = readCollection("users", mockUsers);
  return {
    admin: users.find((u) => u.role === "admin" && u.status === "Activo"),
    user: users.find((u) => u.role === "user" && u.status === "Activo"),
  };
}
