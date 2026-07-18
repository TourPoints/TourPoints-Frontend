import { apiGet, apiGetItems, isApiEnabled, ApiError } from "./api.client.js";
import { getCurrentUser, updateSessionUser } from "./auth.service.js";

// Puntos del usuario. Cableado al backend real (docs/CABLEADO.md).
//
// El saldo NUNCA se guarda como columna en su modelo: es SUM(puntos) del
// ledger (movimientos_puntos), expuesto en GET /visits/me/balance. La copia
// en la sesión (user.points) es solo caché de pintado: se refresca aquí y
// las vistas siguen leyéndola en síncrono como siempre.
//
// Sin backend no hay ledger: el saldo es el user.points de la sesión local,
// que acreditan los retos en modo demo.

/**
 * Saldo actual de puntos del usuario con sesión.
 * @returns {Promise<number>} 0 si no hay sesión.
 */
export async function getMyBalance() {
  const user = getCurrentUser();
  if (!user) return 0;

  if (isApiEnabled("points")) {
    try {
      const res = await apiGet("/visits/me/balance");
      return Number(res?.saldo) || 0;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return 0;
      throw error;
    }
  }

  return Number(user.points) || 0;
}

/**
 * Movimientos del ledger del usuario, del más reciente al más antiguo.
 * Cada uno: { id, tipo_movimiento (VISITA|COMPRA|RETO|CANJE), puntos, created_at }.
 * @returns {Promise<Array<Object>>} Vacío sin sesión o sin backend.
 */
export async function getMyMovements() {
  const user = getCurrentUser();
  if (!user || !isApiEnabled("points")) return [];

  try {
    const items = await apiGetItems("/points/me/movements");
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return [];
    throw error;
  }
}

/**
 * Refresca la copia de puntos de la sesión con el saldo real del ledger.
 * Las vistas que pintan puntos (header, dashboard, recompensas, retos) la
 * llaman al inicializarse; devuelve el saldo vigente para pintar directo.
 * @returns {Promise<number>}
 */
export async function refreshSessionPoints() {
  const user = getCurrentUser();
  if (!user) return 0;

  if (!isApiEnabled("points")) return Number(user.points) || 0;

  const saldo = await getMyBalance();
  updateSessionUser({ points: saldo });
  return saldo;
}
