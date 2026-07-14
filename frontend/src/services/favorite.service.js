const FAVORITES_KEY = "tourpoints_favorites";

function getStoredFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

/**
 * Comprueba si un POI está en favoritos del usuario.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<boolean>}
 */
export async function isFavorite(poiId) {
  // TODO: Reemplazar con fetch(`/api/favorites/${poiId}`) cuando el backend esté listo
  const favorites = getStoredFavorites();
  return Promise.resolve(favorites.includes(Number(poiId)));
}

/**
 * Alterna el estado de favorito de un POI.
 * @param {number|string} poiId - ID del POI.
 * @returns {Promise<boolean>} Nuevo estado (true = favorito).
 */
export async function toggleFavorite(poiId) {
  // TODO: Reemplazar con fetch(`/api/favorites/${poiId}`, { method: 'POST/DELETE' }) cuando el backend esté listo
  const id = Number(poiId);
  const favorites = getStoredFavorites();
  const index = favorites.indexOf(id);
  let isNowFavorite;

  if (index === -1) {
    favorites.push(id);
    isNowFavorite = true;
  } else {
    favorites.splice(index, 1);
    isNowFavorite = false;
  }

  saveFavorites(favorites);
  return Promise.resolve(isNowFavorite);
}
