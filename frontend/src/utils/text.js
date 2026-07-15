// Utilidades de texto compartidas por las vistas de búsqueda.

// Rango Unicode de los diacríticos combinantes que deja NFD (tildes, diéresis, etc.).
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Normaliza un texto para poder compararlo sin tildes ni mayúsculas.
 * Necesario porque los nombres reales llevan tilde ("Real Jardín Botánico")
 * pero los usuarios escriben sin ella ("jardin").
 * @param {string} value - Texto de entrada.
 * @returns {string} Texto en minúsculas, sin diacríticos y sin espacios sobrantes.
 */
export function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .trim();
}

/**
 * Indica si un texto contiene el término buscado, ignorando tildes y mayúsculas.
 * @param {string} haystack - Texto donde buscar.
 * @param {string} needle - Término ya normalizado.
 * @returns {boolean}
 */
export function includesNormalized(haystack, needle) {
  if (!needle) return true;
  return normalizeText(haystack).includes(needle);
}

/**
 * Retrasa la ejecución de una función hasta que dejan de llegar llamadas.
 * Se usa para no filtrar en cada pulsación de tecla.
 * @param {Function} fn - Función a ejecutar.
 * @param {number} delay - Milisegundos de espera.
 * @returns {Function} Función envuelta.
 */
export function debounce(fn, delay = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
