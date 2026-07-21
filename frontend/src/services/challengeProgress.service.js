import { readCollection, writeCollection } from "./localStore.js";
import { getCurrentUser } from "./auth.service.js";
import { apiGetItems, apiPost, isApiEnabled, ApiError } from "./api.client.js";

// Progreso de retos por usuario. Cableado al backend real (docs/CABLEADO.md).
//
// Contra la API, el progreso vive en usuario_retos: cada fila es UN intento
// dentro de un periodo (así modelan la recurrencia). Aquí se proyecta al
// modelo plano del frontend — un estado por reto — tomando el intento más
// reciente: ACTIVO → en-curso, FINALIZADO → completado, CANCELADO → vuelve a
// estar disponible.
//
// Las vistas leen en síncrono durante el render, así que igual que en
// favoritos hay una caché en memoria que llena refreshMyChallengeProgress()
// al inicializar cada vista.
//
// Sin backend, el almacenamiento local por usuario de siempre.

const COLLECTION = "challenge-progress";

/** Estados de progreso de un reto para un usuario. */
export const PROGRESS = {
  AVAILABLE: "disponible",
  IN_PROGRESS: "en-curso",
  COMPLETED: "completado",
};

// Caché del modo API, ligada al usuario que la llenó.
let cacheEntries = [];
let cacheUserId = null;

const cacheValida = () => {
  const user = getCurrentUser();
  return Boolean(user) && cacheUserId === user.id;
};

const ESTADO_MAP = { ACTIVO: PROGRESS.IN_PROGRESS, FINALIZADO: PROGRESS.COMPLETED };

/**
 * Lee todas las entradas de progreso locales (todas las cuentas).
 * Cada entrada: { userId, challengeId, state, updatedAt }.
 */
function readAll() {
  return readCollection(COLLECTION, []);
}

/**
 * Trae del backend los intentos del usuario y llena la caché.
 * Las vistas la llaman al inicializarse; en modo local no hace nada.
 * @returns {Promise<Array<Object>>} Entradas { challengeId, state, updatedAt, porcentaje }.
 */
export async function refreshMyChallengeProgress() {
  const user = getCurrentUser();
  if (!user || !isApiEnabled("challenges")) return [];

  try {
    const items = await apiGetItems("/challenges/me");
    // Puede haber varios intentos por reto (periodos): manda el más reciente.
    const porReto = new Map();
    items
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach((intento) => {
        if (porReto.has(intento.reto_id)) return;
        const state = ESTADO_MAP[intento.estado];
        if (!state) return; // CANCELADO: el reto vuelve a estar disponible
        porReto.set(intento.reto_id, {
          challengeId: intento.reto_id,
          state,
          updatedAt: intento.fecha_completado ?? intento.created_at,
          porcentaje: Number(intento.porcentaje) || 0,
        });
      });

    cacheEntries = [...porReto.values()];
    cacheUserId = user.id;
    return [...cacheEntries];
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      cacheEntries = [];
      cacheUserId = null;
      return [];
    }
    throw error;
  }
}

/**
 * Progreso del usuario con sesión iniciada. Síncrona: en modo API lee la
 * caché que llenó refreshMyChallengeProgress().
 * @returns {Map<string, string>} challengeId → estado.
 */
export function getMyProgress() {
  const user = getCurrentUser();
  if (!user) return new Map();

  if (isApiEnabled("challenges")) {
    if (!cacheValida()) return new Map();
    return new Map(cacheEntries.map((e) => [e.challengeId, e.state]));
  }

  return new Map(
    readAll()
      .filter((entry) => entry.userId === user.id)
      .map((entry) => [entry.challengeId, entry.state])
  );
}

/**
 * Estado de un reto concreto para el usuario actual.
 * @param {string} challengeId
 * @returns {string} Uno de PROGRESS.*; "disponible" si no hay registro o sesión.
 */
export function getChallengeState(challengeId) {
  return getMyProgress().get(challengeId) ?? PROGRESS.AVAILABLE;
}

/**
 * Entradas de progreso del usuario con su fecha, de la más reciente a la más
 * antigua. Las usa el historial local del dashboard.
 * @returns {Array<Object>} Entradas { challengeId, state, updatedAt }.
 */
export function getMyProgressEntries() {
  const user = getCurrentUser();
  if (!user) return [];

  if (isApiEnabled("challenges")) {
    if (!cacheValida()) return [];
    return [...cacheEntries].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return readAll()
    .filter((entry) => entry.userId === user.id)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

/**
 * Fija el estado de un reto para el usuario actual.
 *
 * Contra el backend cada transición es un endpoint distinto:
 *   en-curso   → POST /challenges/{id}/join     (inscribirse al periodo)
 *   disponible → POST /challenges/{id}/abandon  (abandonar el intento)
 *   completado → POST /challenges/{id}/progress (registrar un avance; el
 *                backend decide si el intento queda FINALIZADO y acredita
 *                los puntos en el ledger — aquí nadie suma puntos a mano)
 *
 * @param {string} challengeId
 * @param {string} state - Uno de PROGRESS.*.
 * @returns {Promise<{ok: boolean, state?: string, error?: string}>}
 */
export async function setChallengeState(challengeId, state) {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: "Necesitas iniciar sesión." };

  if (isApiEnabled("challenges")) {
    try {
      if (state === PROGRESS.IN_PROGRESS) {
        await apiPost(`/challenges/${challengeId}/join`);
      } else if (state === PROGRESS.AVAILABLE) {
        await apiPost(`/challenges/${challengeId}/abandon`);
      } else if (state === PROGRESS.COMPLETED) {
        await apiPost(`/challenges/${challengeId}/progress`, {
          incremento: 1,
          detalle: "Avance registrado desde la app",
        });
      }
      await refreshMyChallengeProgress();
      return { ok: true, state: getChallengeState(challengeId) };
    } catch (error) {
      const detalle = typeof error.detail === "string" ? error.detail : null;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
      }
      return { ok: false, error: detalle ?? "No pudimos actualizar el reto. Inténtalo de nuevo." };
    }
  }

  const all = readAll().filter(
    (entry) => !(entry.userId === user.id && entry.challengeId === challengeId)
  );

  if (state !== PROGRESS.AVAILABLE) {
    all.push({
      userId: user.id,
      challengeId,
      state,
      updatedAt: new Date().toISOString(),
    });
  }

  writeCollection(COLLECTION, all);
  return { ok: true, state };
}
