// Datos semilla de Recompensas (US TOUR-39).
// Los consume reward.service.js; el backend los sustituirá por la API.
//
// Ancladas en Barranquilla: hasta el re-seed quedaban rastros de Madrid
// ("Café Central", "Hotel Toledo"), igual que en reseñas y retos.
//
// Los negocios privados van como "aliado" en vez de con nombre propio: son
// datos de demo y no conviene atribuir promociones inventadas a un local que
// existe de verdad. Los lugares públicos (Museo del Caribe, Gran Malecón) sí
// se nombran, porque la recompensa es una entrada o un recorrido, no una
// promesa comercial de un tercero. Encaja con el modelo del backend, donde
// recompensas.poi_id es nullable y las que dependen de un aliado cuelgan de
// su establecimiento.

export const mockRewards = [
  {
    id: "REW-001",
    name: "Café en el Paseo Bolívar",
    description:
      "Un café de especialidad cortesía de una cafetería aliada del centro histórico.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop",
    category: "Restauración",
    pointsCost: 150,
    stock: 45,
    status: "Activo",
    emoji: "☕",
  },
  {
    id: "REW-002",
    name: "10% en hotel de El Prado",
    description:
      "Descuento del 10% en tu próxima estadía en un hotel aliado del barrio El Prado, válido todo el año.",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&h=400&fit=crop",
    category: "Alojamiento",
    pointsCost: 500,
    stock: 20,
    status: "Activo",
    emoji: "🏨",
  },
  {
    id: "REW-003",
    name: "Entrada al Museo del Caribe",
    description:
      "Acceso a la colección permanente del Parque Cultural del Caribe para ti y un acompañante.",
    image: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=600&h=400&fit=crop",
    category: "Cultura",
    pointsCost: 300,
    stock: 15,
    status: "Pendiente",
    emoji: "🎟️",
  },
  {
    id: "REW-004",
    name: "Guía de Curramba de bolsillo",
    description:
      "Guía impresa con los rincones imprescindibles de Barranquilla, edición limitada.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
    category: "Souvenirs",
    pointsCost: 100,
    stock: 120,
    status: "Activo",
    emoji: "📚",
  },
  {
    id: "REW-005",
    name: "Ruta del Malecón al atardecer",
    description:
      "Recorrido guiado por el Gran Malecón del Río con las historias del Magdalena y del Carnaval.",
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
