// Utilidades de fecha.
//
// Los mocks guardan las fechas en ISO (YYYY-MM-DD) para que los <input type="date">
// funcionen sin conversiones, y se formatean a es-ES solo al mostrarlas.

/**
 * Formatea una fecha ISO al formato local español (dd/mm/aaaa).
 * @param {string} isoDate - Fecha en formato YYYY-MM-DD.
 * @returns {string} Fecha formateada, o "—" si no hay valor válido.
 */
export function formatDate(isoDate) {
  if (!isoDate) return "—";

  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(isoDate);

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
