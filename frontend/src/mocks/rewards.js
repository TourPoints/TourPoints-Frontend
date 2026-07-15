// Datos semilla de Recompensas (US TOUR-39).
// Los consume reward.service.js; el backend los sustituirá por la API.

export const mockRewards = [
  {
    id: "REW-001",
    name: "Café gratis en Café Central",
    description: "Disfruta de un café de especialidad cortesía de Café Central, en el centro histórico.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop",
    category: "Restauración",
    pointsCost: 150,
    stock: 45,
    status: "Activo",
    emoji: "☕",
  },
  {
    id: "REW-002",
    name: "Descuento del 10% Hotel Toledo",
    description: "10% de descuento en tu próxima estadía en el Hotel Toledo, válido todo el año.",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&h=400&fit=crop",
    category: "Alojamiento",
    pointsCost: 500,
    stock: 20,
    status: "Activo",
    emoji: "🏨",
  },
  {
    id: "REW-003",
    name: "Entrada gratuita Museo Arte",
    description: "Acceso gratuito a la colección permanente del Museo de Arte para ti y un acompañante.",
    image: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600&h=400&fit=crop",
    category: "Cultura",
    pointsCost: 300,
    stock: 15,
    status: "Pendiente",
    emoji: "🎟️",
  },
  {
    id: "REW-004",
    name: "Guía Turística de Bolsillo",
    description: "Guía impresa con los rincones imprescindibles de la ciudad, edición limitada.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
    category: "Souvenirs",
    pointsCost: 100,
    stock: 120,
    status: "Activo",
    emoji: "📚",
  },
  {
    id: "REW-005",
    name: "Tour Nocturno de Leyendas",
    description: "Recorrido guiado nocturno por las leyendas y rincones más misteriosos de la ciudad.",
    image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&h=400&fit=crop",
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
