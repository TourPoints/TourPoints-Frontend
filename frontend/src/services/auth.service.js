import { mockUsers } from "../mocks/users.js";
import { readCollection } from "./localStore.js";
import { createUser } from "./user.service.js";
import { setRole, clearRole } from "../utils/role.js";
import { normalizeText } from "../utils/text.js";
import { apiGet, apiPost, apiPatch, isApiEnabled, saveToken, clearToken, ApiError } from "./api.client.js";

// Servicio de sesión. Primer módulo cableado al backend real (docs/CABLEADO.md).
//
// Con "auth" en API_MODULES y VITE_API_URL definida:
//   POST /auth/register → crea la cuenta (el backend asigna el rol)
//   POST /auth/login    → { access_token, token_type }
//   GET  /users/me      → el usuario del token
// El login desplegado NO devuelve el usuario (su contrato escrito lo
// prometía), así que la sesión se completa encadenando GET /users/me.
//
// Sin backend, MODO DEMO: la "autenticación" solo comprueba que el email
// exista entre los usuarios registrados y la contraseña se ignora — validarla
// en el navegador no aportaría ninguna garantía real.

const SESSION_KEY = "tourpoints:session";

// El backend identifica roles por id numérico (usuarios.rol_id → catálogo
// `roles`), y su DDL no precarga el catálogo. ⚠️ SUPUESTO pendiente de
// confirmar con el equipo backend: 1 = ADMIN. Si el catálogo real difiere,
// este es el único número que hay que corregir.
const ADMIN_ROL_ID = 1;

/**
 * Traduce el UsuarioResponse del backend al modelo de usuario del frontend.
 * Lo comparte user.service para el CRUD del panel de administración.
 */
export function adaptUsuario(u) {
  return {
    id: u.id,
    name: [u.nombre, u.apellido].filter(Boolean).join(" "),
    email: u.email,
    role: u.rol_id === ADMIN_ROL_ID ? "admin" : "user",
    status: u.estado === "ACTIVO" ? "Activo" : u.estado === "SUSPENDIDO" ? "Suspendido" : u.estado,
    // El backend no guarda puntos en el usuario: salen del ledger
    // (GET /puntos/me/saldo, aún sin desplegar). Hasta ese cable, 0.
    points: 0,
    joined: (u.created_at ?? "").slice(0, 10),
    telefono: u.telefono ?? null,
    foto_url: u.foto_url ?? null,
  };
}

/** Mensaje legible para los errores de la API de auth. */
function authErrorMessage(error, fallback) {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 401) return "Email o contraseña incorrectos.";
  if (error.status === 403) return "Esta cuenta está suspendida. Contacta con un administrador.";
  if (error.status === 409 || error.status === 400) {
    return typeof error.detail === "string" ? error.detail : "Ya existe una cuenta con ese email.";
  }
  if (error.status === 422) {
    // FastAPI detalla el campo que falló; el primero suele bastar.
    const first = Array.isArray(error.detail) ? error.detail[0]?.msg : null;
    return first ?? "Revisa los datos del formulario.";
  }
  if (error.status === 408) return "El servidor tardó demasiado. Inténtalo de nuevo.";
  return fallback;
}

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
 * Inicia sesión.
 * @param {string} email - Email introducido.
 * @param {string} [password] - Contraseña; solo se usa contra el backend real.
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>} Resultado.
 */
export async function login(email, password = "") {
  if (isApiEnabled("auth")) {
    try {
      const { access_token: token } = await apiPost("/auth/login", { email, password });
      saveToken(token);

      const me = await apiGet("/users/me");
      const user = adaptUsuario(me);
      startSession(user);
      return { ok: true, user };
    } catch (error) {
      clearToken();
      console.error("Login contra la API falló:", error);
      return { ok: false, error: authErrorMessage(error, "No pudimos iniciar sesión. Inténtalo de nuevo.") };
    }
  }

  // ── MODO DEMO (sin backend) ─────────────────────────────────
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
 * @param {string} [data.password] - Contraseña; solo contra el backend real.
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>} Resultado.
 */
export async function register({ name, email, password = "" }) {
  if (isApiEnabled("auth")) {
    // El backend separa nombre y apellido; el formulario pide el nombre
    // completo. Primera palabra = nombre, el resto = apellido (si solo hay
    // una, se repite: el campo es obligatorio en su esquema).
    const parts = String(name).trim().split(/\s+/);
    const nombre = parts[0];
    const apellido = parts.slice(1).join(" ") || nombre;

    try {
      // rol_id NO se envía jamás, aunque el esquema desplegado lo acepte:
      // el rol lo asigna el backend. (Avisado en docs/CABLEADO.md — que un
      // register público acepte rol_id es una pregunta abierta para ellos.)
      await apiPost("/auth/register", { nombre, apellido, email, password });

      // El register devuelve el usuario pero no el token: se encadena el
      // login para dejar la sesión abierta, como espera el resto de la app.
      return await login(email, password);
    } catch (error) {
      console.error("Registro contra la API falló:", error);
      return { ok: false, error: authErrorMessage(error, "No pudimos crear la cuenta. Inténtalo de nuevo.") };
    }
  }

  // ── MODO DEMO (sin backend) ─────────────────────────────────
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

/**
 * Edita el perfil del usuario con sesión contra el backend (PATCH /users/me)
 * y refresca la copia de la sesión. Solo en modo API: el dashboard lo usa en
 * lugar del CRUD de admin, que exige otro rol.
 * @param {{name?: string, email?: string}} changes
 * @returns {Promise<{ok: boolean, user?: Object, error?: string}>}
 */
export async function updateMyProfile(changes) {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: "No hay sesión iniciada." };

  const body = {};
  if (changes.name !== undefined) {
    const parts = String(changes.name).trim().split(/\s+/);
    body.nombre = parts[0];
    body.apellido = parts.slice(1).join(" ") || parts[0];
  }
  if (changes.email !== undefined) body.email = changes.email;

  try {
    const actualizado = await apiPatch("/users/me", body);
    const adaptado = adaptUsuario(actualizado);
    // points es caché del ledger: se conserva el valor vigente de la sesión.
    const merged = updateSessionUser({ name: adaptado.name, email: adaptado.email });
    return { ok: true, user: merged };
  } catch (error) {
    return { ok: false, error: authErrorMessage(error, "No pudimos guardar los cambios. Inténtalo de nuevo.") };
  }
}

/**
 * Actualiza campos del usuario en la sesión activa (p.ej. los puntos tras
 * completar un reto). No toca la colección de usuarios: eso es cosa de
 * user.service; aquí solo se refresca la copia de la sesión.
 * @param {Object} changes - Campos a fusionar.
 * @returns {Object|null} El usuario de sesión actualizado.
 */
export function updateSessionUser(changes) {
  const user = getCurrentUser();
  if (!user) return null;

  const updated = { ...user, ...changes, id: user.id };
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}

/** Cierra la sesión actual (local y token del backend). */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
  clearRole();
  clearToken();
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
 * Solo tienen sentido en modo demo: contra el backend real no existen.
 * @returns {{admin: Object|undefined, user: Object|undefined}}
 */
export function getDemoAccounts() {
  if (isApiEnabled("auth")) return { admin: undefined, user: undefined };

  const users = readCollection("users", mockUsers);
  return {
    admin: users.find((u) => u.role === "admin" && u.status === "Activo"),
    user: users.find((u) => u.role === "user" && u.status === "Activo"),
  };
}
