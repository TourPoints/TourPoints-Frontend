// Datos semilla de Desafíos (US TOUR-39).
// Los consume challenge.service.js; el backend los sustituirá por la API.
//
// Los retos apuntan a los POI reales de mocks/pois.js: son de Barranquilla, no
// genéricos. Hasta el re-seed este archivo seguía en Madrid —"Caminante del
// Retiro", "Fotógrafo de Toledo", "Maratón de Tapas"— igual que le pasó a las
// reseñas. Al tocar los POIs hay que tocar también estos retos.
//
// Las fechas límite se calculan en vez de fijarse a mano: estaban clavadas en
// 2025 y nacieron caducadas. Así la semilla siempre propone retos vigentes.

/**
 * Fecha (solo día) dentro de N días, para los plazos de la semilla.
 * @param {number} days - Días hacia adelante.
 * @returns {string} Fecha en formato aaaa-mm-dd.
 */
const inDays = (days) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const mockChallenges = [
  {
    id: "CHL-001",
    name: "Ruta del Caribe",
    type: "Cultural",
    difficulty: "Medio",
    status: "Activo",
    points: 500,
    deadline: inDays(120),
    image: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&h=400&fit=crop",
    description:
      "Visita el Museo del Caribe, La Cueva y el Teatro Amira de la Rosa. Tres paradas que cuentan de dónde viene la ciudad.",
  },
  {
    id: "CHL-002",
    name: "Sabor Curramba",
    type: "Gastronomía",
    difficulty: "Fácil",
    status: "Activo",
    points: 250,
    deadline: inDays(60),
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    description:
      "Haz check-in en 2 cocinas del centro y desbloquea el sabor local: butifarra, bollo de yuca o una cazuela frente al río.",
  },
  {
    id: "CHL-003",
    name: "Caminante del Malecón",
    type: "Naturaleza",
    difficulty: "Fácil",
    status: "Pendiente",
    points: 300,
    deadline: inDays(90),
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
    description:
      "Recorre los cinco kilómetros del Gran Malecón del Río y registra tu visita mirando al Magdalena.",
  },
  {
    id: "CHL-004",
    name: "Fotógrafo de la Ventana",
    type: "Cultural",
    difficulty: "Difícil",
    status: "Activo",
    points: 800,
    deadline: inDays(45),
    image: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=600&h=400&fit=crop",
    description:
      "Captura la Ventana al Mundo al atardecer, cuando se encienden sus luces, y comparte tu toma con la comunidad.",
  },
  {
    id: "CHL-005",
    name: "Maratón de Fritos",
    type: "Gastronomía",
    difficulty: "Medio",
    status: "Inactivo",
    points: 400,
    deadline: inDays(30),
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop",
    description:
      "Arepa e' huevo, carimañola y empanada en 4 puestos distintos, en una sola tarde. El reto más honesto de Curramba.",
  },
];

export const CHALLENGE_TYPES = ["Cultural", "Gastronomía", "Naturaleza"];
export const CHALLENGE_DIFFICULTIES = ["Fácil", "Medio", "Difícil"];
