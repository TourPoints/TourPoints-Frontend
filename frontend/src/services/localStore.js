// Repositorio genérico sobre localStorage.
//
// Sustituye a la API mientras el backend no existe: mantiene las colecciones
// entre recargas y expone las mismas operaciones que tendrá el servicio real
// (list / getById / create / update / remove). Los servicios de dominio se
// apoyan aquí cuando no hay VITE_API_URL configurada.

const STORAGE_PREFIX = "tourpoints:";

// Versión de los datos semilla. Al cambiarla se descartan las colecciones
// guardadas y se vuelve a sembrar desde los mocks: sin esto, quien ya visitó
// la app seguiría viendo los datos antiguos (p.ej. los POIs de Madrid) aunque
// los mocks digan otra cosa. Solo aplica a la fase sin backend; con API real
// este archivo desaparece entero.
const SEED_VERSION = "2-barranquilla";
const SEED_VERSION_KEY = STORAGE_PREFIX + "seed-version";

if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION) {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
}

/**
 * Lee una colección de localStorage. Si no existe todavía, la inicializa
 * con los datos semilla para que la primera visita no vea una tabla vacía.
 * @param {string} collection - Nombre de la colección, p.ej. "pois".
 * @param {Array<Object>} seed - Datos iniciales.
 * @returns {Array<Object>} La colección almacenada.
 */
export function readCollection(collection, seed = []) {
  const key = STORAGE_PREFIX + collection;
  const stored = localStorage.getItem(key);

  if (stored === null) {
    writeCollection(collection, seed);
    return [...seed];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [...seed];
  } catch (error) {
    // Si alguien dejó el storage corrupto, preferimos volver a la semilla
    // antes que romper toda la vista.
    console.warn(`Colección "${collection}" corrupta en localStorage. Se restaura.`, error);
    writeCollection(collection, seed);
    return [...seed];
  }
}

/**
 * Persiste una colección completa.
 * @param {string} collection - Nombre de la colección.
 * @param {Array<Object>} items - Elementos a guardar.
 */
export function writeCollection(collection, items) {
  localStorage.setItem(STORAGE_PREFIX + collection, JSON.stringify(items));
}

/**
 * Restaura una colección a sus datos semilla, descartando los cambios locales.
 * @param {string} collection - Nombre de la colección.
 * @param {Array<Object>} seed - Datos iniciales.
 * @returns {Array<Object>} La colección restaurada.
 */
export function resetCollection(collection, seed = []) {
  writeCollection(collection, seed);
  return [...seed];
}

/**
 * Genera el siguiente identificador numérico libre de una colección.
 * @param {Array<Object>} items - Colección actual.
 * @returns {number} Id no usado.
 */
export function nextNumericId(items) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return maxId + 1;
}

/**
 * Genera el siguiente identificador con prefijo, p.ej. "CHL-006".
 * @param {Array<Object>} items - Colección actual.
 * @param {string} prefix - Prefijo sin guion, p.ej. "CHL".
 * @returns {string} Id no usado.
 */
export function nextPrefixedId(items, prefix) {
  const maxNumber = items.reduce((max, item) => {
    const match = String(item.id).match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `${prefix}-${String(maxNumber + 1).padStart(3, "0")}`;
}
