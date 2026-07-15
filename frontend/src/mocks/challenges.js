// Datos semilla de Desafíos (US TOUR-39).
// Los consume challenge.service.js; el backend los sustituirá por la API.

export const mockChallenges = [
  {
    id: "CHL-001",
    name: "Ruta de los Museos",
    type: "Cultural",
    difficulty: "Medio",
    status: "Activo",
    points: 500,
    deadline: "2025-12-31",
    image: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&h=400&fit=crop",
    description: "Visita y tómate una foto en 3 museos icónicos de la ciudad para completar la ruta cultural.",
  },
  {
    id: "CHL-002",
    name: "Gastrónomo Urbano",
    type: "Gastronomía",
    difficulty: "Fácil",
    status: "Activo",
    points: 250,
    deadline: "2025-10-15",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    description: "Haz check-in en 2 cafeterías o restaurantes del centro histórico y desbloquea el sabor local.",
  },
  {
    id: "CHL-003",
    name: "Caminante del Retiro",
    type: "Naturaleza",
    difficulty: "Fácil",
    status: "Pendiente",
    points: 300,
    deadline: "2025-11-01",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
    description: "Recorre los senderos naturales y registra tu visita para ganar puntos extra.",
  },
  {
    id: "CHL-004",
    name: "Fotógrafo de Toledo",
    type: "Cultural",
    difficulty: "Difícil",
    status: "Activo",
    points: 800,
    deadline: "2025-09-20",
    image: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=600&h=400&fit=crop",
    description: "Captura las mejores vistas panorámicas y comparte tu experiencia con la comunidad.",
  },
  {
    id: "CHL-005",
    name: "Maratón de Tapas",
    type: "Gastronomía",
    difficulty: "Medio",
    status: "Inactivo",
    points: 400,
    deadline: "2025-08-01",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    description: "Prueba tapas en 4 locales distintos en una sola tarde para completar el maratón.",
  },
];

export const CHALLENGE_TYPES = ["Cultural", "Gastronomía", "Naturaleza"];
export const CHALLENGE_DIFFICULTIES = ["Fácil", "Medio", "Difícil"];
