import { matchesAllTerms } from "./text.js";

// Lógica de filtrado y ordenación de POIs compartida por las vistas
// de exploración y de mapa, para que ambas se comporten igual.

export const ALL_CATEGORIES = "Todas";

// Campos sobre los que actúa la búsqueda por texto libre.
//
// `address` faltaba, así que buscar "calle 84" no encontraba nada aunque un POI
// esté literalmente en esa calle. `location` se queda porque distingue
// Barranquilla de Puerto Colombia, aunque casi todos compartan valor.
const SEARCHABLE_FIELDS = ["name", "description", "location", "address", "category"];

/**
 * Extrae las categorías disponibles a partir de los datos reales.
 * Se deriva de los POIs en lugar de codificarlas a mano para que las vistas
 * no se desincronicen cuando el backend añada o quite categorías.
 * @param {Array<Object>} pois - Lista de POIs.
 * @returns {Array<string>} Categorías únicas, con "Todas" al inicio.
 */
export function getCategories(pois = []) {
  const unique = [...new Set(pois.map((poi) => poi.category).filter(Boolean))];
  unique.sort((a, b) => a.localeCompare(b, "es"));
  return [ALL_CATEGORIES, ...unique];
}

/**
 * Filtra los POIs por categoría y por texto libre, ignorando tildes y mayúsculas.
 * @param {Array<Object>} pois - Lista completa de POIs.
 * @param {Object} criteria - Criterios de filtrado.
 * @param {string} [criteria.category] - Categoría activa o "Todas".
 * @param {string} [criteria.query] - Término de búsqueda tal cual lo escribió el usuario.
 * @returns {Array<Object>} POIs que cumplen ambos criterios.
 */
export function filterPois(pois = [], { category = ALL_CATEGORIES, query = "" } = {}) {
  return pois.filter((poi) => {
    const matchesCategory = category === ALL_CATEGORIES || poi.category === category;
    if (!matchesCategory) return false;

    // Todos los campos van a un mismo texto: así "cultura museo" puede casar
    // la categoría con una palabra y el nombre con la otra. Antes se exigía
    // que un único campo contuviera la búsqueda entera como subcadena.
    return matchesAllTerms(SEARCHABLE_FIELDS.map((field) => poi[field]).join(" "), query);
  });
}

/**
 * Ordena una lista de POIs sin mutar la original.
 * @param {Array<Object>} pois - POIs ya filtrados.
 * @param {string} sortBy - Criterio: Recomendados | PuntosDesc | PuntosAsc | Nombre | Distancia.
 * @returns {Array<Object>} Nueva lista ordenada.
 */
export function sortPois(pois = [], sortBy = "Recomendados") {
  const sorted = [...pois];

  switch (sortBy) {
    case "PuntosDesc":
      return sorted.sort((a, b) => b.points - a.points);
    case "PuntosAsc":
      return sorted.sort((a, b) => a.points - b.points);
    case "Nombre":
      return sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "Distancia":
      return sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    case "Recomendados":
    default:
      return sorted.sort((a, b) => b.rating - a.rating);
  }
}

/**
 * Formatea una calificación para mostrar, o null si el POI no tiene ninguna
 * todavía. El promedio real nunca puede valer 0 (las calificaciones van de 1
 * a 5), así que 0 siempre significa "sin calificar" y no una nota real: sin
 * este chequeo, un POI recién creado se leía como "0.0 estrellas", que
 * parece una mala nota en vez de la ausencia de una.
 * @param {number} rating
 * @returns {string|null}
 */
export function formatRating(rating) {
  const value = Number(rating) || 0;
  return value > 0 ? value.toFixed(1) : null;
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas (fórmula de Haversine).
 * @returns {number} Distancia en kilómetros.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Añade a cada POI su distancia respecto a unas coordenadas de origen.
 * @param {Array<Object>} pois - POIs a enriquecer.
 * @param {{lat: number, lng: number}} origin - Coordenadas de referencia.
 * @returns {Array<Object>} Copias de los POIs con el campo `distance` en km.
 */
export function withDistanceFrom(pois = [], origin) {
  return pois.map((poi) => ({
    ...poi,
    distance: calculateDistanceKm(origin.lat, origin.lng, poi.lat, poi.lng),
  }));
}
