import { apiGetItems, apiPost, isApiEnabled, ApiError } from "./api.client.js";

// Visitas (check-in). Cableado al backend real (docs/CABLEADO.md).
//
// Contra la API el check-in es el corazón del producto: POST /visits manda
// las coordenadas del usuario, PostGIS mide la distancia real contra la
// ubicación del POI y su radio_validacion, y si la visita queda VALIDADA el
// backend acredita los puntos en el ledger según reglas_puntos. El mensaje
// de "los puntos se acreditarán cuando el backend esté conectado" murió aquí.
//
// Sin backend, el registro local de siempre (sin puntos, como estaba).

const VISITS_KEY = "tourpoints:visits";

function getStoredVisits() {
  try {
    const stored = localStorage.getItem(VISITS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveVisits(visits) {
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
}

/**
 * Comprueba si el usuario ya registró una visita (no rechazada) a un POI.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<boolean>}
 */
export async function hasVisited(poiId) {
  if (isApiEnabled("visits")) {
    try {
      const items = await apiGetItems("/visits/me");
      const id = String(poiId);
      return items.some(
        (v) => String(v.poi_id ?? v.poi?.id) === id && v.estado !== "RECHAZADA"
      );
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return false;
      throw error;
    }
  }

  const visits = getStoredVisits();
  return visits.includes(Number(poiId));
}

/**
 * Registra una visita a un Punto de Interés.
 * @param {number|string} poiId - ID del POI.
 * @param {{ lat: number, lng: number, accuracy?: number }} coords - Ubicación
 *   del usuario al registrar (accuracy en metros, si el GPS la da).
 * @returns {Promise<{ success: boolean, points: number, message: string }>}
 */
export async function registerVisit(poiId, coords) {
  if (isApiEnabled("visits")) {
    try {
      const visita = await apiPost("/visits", {
        poi_id: String(poiId),
        metodo_validacion: "GPS",
        ubicacion_usuario: { lat: coords.lat, lng: coords.lng },
        precision_metros: coords.accuracy ?? null,
      });

      if (visita.estado === "VALIDADA") {
        const pts = Number(visita.puntos_otorgados) || 0;
        return {
          success: true,
          points: pts,
          message: pts > 0
            ? `¡Visita validada! Ganaste ${pts.toLocaleString("es-ES")} puntos.`
            : "¡Visita validada!",
        };
      }

      if (visita.estado === "PENDIENTE") {
        return { success: true, points: 0, message: "Tu visita quedó registrada, pendiente de validación." };
      }

      // RECHAZADA: el usuario está fuera del radio del POI. La distancia real
      // la midió PostGIS; decírsela convierte el rechazo en algo accionable.
      const metros = visita.distancia_metros != null ? Math.round(visita.distancia_metros) : null;
      return {
        success: false,
        points: 0,
        message: metros != null
          ? `Estás a ${metros.toLocaleString("es-ES")} m del lugar. Acércate un poco más e inténtalo de nuevo.`
          : "No pudimos validar que estés en el lugar. Acércate e inténtalo de nuevo.",
      };
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return { success: false, points: 0, message: "Tu sesión expiró. Vuelve a iniciar sesión para registrar la visita." };
      }
      const detalle = typeof error.detail === "string" ? error.detail : null;
      return { success: false, points: 0, message: detalle ?? "No pudimos registrar la visita. Inténtalo de nuevo." };
    }
  }

  const id = Number(poiId);
  const visits = getStoredVisits();

  if (visits.includes(id)) {
    return { success: false, points: 0, message: "Ya has registrado una visita a este lugar." };
  }

  visits.push(id);
  saveVisits(visits);

  return {
    success: true,
    points: 0,
    message: "¡Visita registrada con éxito! Los puntos se acreditarán cuando el backend esté conectado.",
  };
}
