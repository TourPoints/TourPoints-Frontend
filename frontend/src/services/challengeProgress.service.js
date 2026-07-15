import { readCollection, writeCollection } from "./localStore.js";
import { getCurrentUser } from "./auth.service.js";

// Progreso de retos por usuario (US TOUR-35).
//
// El estado de publicación de un reto (Activo/Pendiente/Inactivo) vive en
// challenge.service y lo gestiona el admin. Este servicio guarda lo OTRO:
// en qué punto está cada usuario con cada reto. Son dimensiones distintas y
// mezclarlas fue lo que dejó al panel y a las vistas públicas desconectados
// en el pasado.
//
// ── ENDPOINTS esperados (backend) ─────────────────────────────
//   GET   /me/challenges                → progreso del usuario
//   POST  /me/challenges/:id/start     → comenzar reto
//   POST  /me/challenges/:id/complete  → completar y acreditar puntos
//   DELETE /me/challenges/:id          → abandonar reto
// ──────────────────────────────────────────────────────────────

const COLLECTION = "challenge-progress";

/** Estados de progreso de un reto para un usuario. */
export const PROGRESS = {
  AVAILABLE: "disponible",
  IN_PROGRESS: "en-curso",
  COMPLETED: "completado",
};

/**
 * Lee todas las entradas de progreso (todas las cuentas).
 * Cada entrada: { userId, challengeId, state, updatedAt }.
 */
function readAll() {
  return readCollection(COLLECTION, []);
}

/**
 * Progreso del usuario con sesión iniciada.
 * @returns {Map<string, string>} challengeId → estado.
 */
export function getMyProgress() {
  const user = getCurrentUser();
  if (!user) return new Map();

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
 * Fija el estado de un reto para el usuario actual.
 * @param {string} challengeId
 * @param {string} state - Uno de PROGRESS.*.
 * @returns {boolean} false si no hay sesión.
 */
export function setChallengeState(challengeId, state) {
  const user = getCurrentUser();
  if (!user) return false;

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
  return true;
}
