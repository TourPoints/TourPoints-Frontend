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

// Escalones para el tiempo relativo, del más grueso al más fino. Se recorre
// en orden y gana el primero que quepa, que es como lo diría una persona:
// "hace 2 meses" antes que "hace 61 días".
const RELATIVE_UNITS = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
];

const relativeFormatter = new Intl.RelativeTimeFormat("es-ES", { numeric: "always" });

/**
 * Formatea un instante como tiempo relativo ("Hace 2 días").
 *
 * Se delega en Intl.RelativeTimeFormat en vez de construir la cadena a mano:
 * resuelve solo los plurales del español y no hay que mantener traducciones.
 *
 * @param {string} isoDateTime - Instante en ISO 8601.
 * @returns {string} Texto relativo con la inicial en mayúscula, o "—" si no es válido.
 */
export function formatRelativeDate(isoDateTime) {
  if (!isoDateTime) return "—";

  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return String(isoDateTime);

  const elapsed = Date.now() - date.getTime();
  if (elapsed < 60 * 1000) return "Ahora mismo";

  const match = RELATIVE_UNITS.find((step) => elapsed >= step.ms);
  if (!match) return "Ahora mismo";

  const amount = Math.floor(elapsed / match.ms);
  const text = relativeFormatter.format(-amount, match.unit);

  return text.charAt(0).toUpperCase() + text.slice(1);
}
