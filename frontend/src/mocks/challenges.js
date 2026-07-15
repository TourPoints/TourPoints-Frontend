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
  },
  {
    id: "CHL-002",
    name: "Gastrónomo Urbano",
    type: "Gastronomía",
    difficulty: "Fácil",
    status: "Activo",
    points: 250,
    deadline: "2025-10-15",
  },
  {
    id: "CHL-003",
    name: "Caminante del Retiro",
    type: "Naturaleza",
    difficulty: "Fácil",
    status: "Pendiente",
    points: 300,
    deadline: "2025-11-01",
  },
  {
    id: "CHL-004",
    name: "Fotógrafo de Toledo",
    type: "Cultural",
    difficulty: "Difícil",
    status: "Activo",
    points: 800,
    deadline: "2025-09-20",
  },
  {
    id: "CHL-005",
    name: "Maratón de Tapas",
    type: "Gastronomía",
    difficulty: "Medio",
    status: "Inactivo",
    points: 400,
    deadline: "2025-08-01",
  },
];

export const CHALLENGE_TYPES = ["Cultural", "Gastronomía", "Naturaleza"];
export const CHALLENGE_DIFFICULTIES = ["Fácil", "Medio", "Difícil"];
