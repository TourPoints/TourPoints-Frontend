const VISITS_KEY = "tourpoints_visits";

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
 * Comprueba si el usuario ya registró una visita a un POI.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<boolean>}
 */
export async function hasVisited(poiId) {
  // TODO: Reemplazar con fetch(`/api/visits/${poiId}`) cuando el backend esté listo
  const visits = getStoredVisits();
  return Promise.resolve(visits.includes(Number(poiId)));
}

/**
 * Registra una visita a un Punto de Interés.
 * @param {number|string} poiId - ID del POI.
 * @param {{ lat: number, lng: number }} coords - Coordenadas del usuario al registrar.
 * @returns {Promise<{ success: boolean, points: number, message: string }>}
 */
export async function registerVisit(poiId, coords) {
  // TODO: Reemplazar con fetch('/api/visits', { method: 'POST', body: { poiId, coords } }) cuando el backend esté listo
  const id = Number(poiId);
  const visits = getStoredVisits();

  if (visits.includes(id)) {
    return Promise.resolve({
      success: false,
      points: 0,
      message: "Ya has registrado una visita a este lugar.",
    });
  }

  visits.push(id);
  saveVisits(visits);

  return Promise.resolve({
    success: true,
    points: 0,
    message: "¡Visita registrada con éxito! Los puntos se acreditarán cuando el backend esté conectado.",
  });
}
