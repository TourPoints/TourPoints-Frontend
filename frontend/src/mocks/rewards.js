// Datos semilla de Recompensas (US TOUR-39).
// Los consume reward.service.js; el backend los sustituirá por la API.

export const mockRewards = [
  {
    id: "REW-001",
    name: "Café gratis en Café Central",
    category: "Restauración",
    pointsCost: 150,
    stock: 45,
    status: "Activo",
    emoji: "☕",
  },
  {
    id: "REW-002",
    name: "Descuento del 10% Hotel Toledo",
    category: "Alojamiento",
    pointsCost: 500,
    stock: 20,
    status: "Activo",
    emoji: "🏨",
  },
  {
    id: "REW-003",
    name: "Entrada gratuita Museo Arte",
    category: "Cultura",
    pointsCost: 300,
    stock: 15,
    status: "Pendiente",
    emoji: "🎟️",
  },
  {
    id: "REW-004",
    name: "Guía Turística de Bolsillo",
    category: "Souvenirs",
    pointsCost: 100,
    stock: 120,
    status: "Activo",
    emoji: "📚",
  },
  {
    id: "REW-005",
    name: "Tour Nocturno de Leyendas",
    category: "Actividades",
    pointsCost: 600,
    stock: 8,
    status: "Inactivo",
    emoji: "🌙",
  },
];

export const REWARD_CATEGORIES = [
  "Restauración",
  "Alojamiento",
  "Cultura",
  "Souvenirs",
  "Actividades",
];
