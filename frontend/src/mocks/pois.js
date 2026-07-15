// Datos semilla de Puntos de Interés: Barranquilla, Colombia.
//
// ⚠️ COORDENADAS POR VERIFICAR
// Las lat/lng son aproximadas y sirven para que el mapa y el cálculo de
// distancias funcionen sobre la ciudad real. Antes de dar el ticket por
// cerrado hay que contrastar cada una contra Google Maps: un POI mal situado
// es peor que ninguno, porque el usuario lo da por bueno.
//
// ⚠️ IMÁGENES DE RELLENO
// Las URLs son fotos genéricas de Unsplash, no de los lugares reales.
// Hay que sustituirlas por fotografías propias o con licencia.

export const mockPois = [
  {
    id: 1,
    name: "Ventana al Mundo",
    category: "Cultura",
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555992336-fb0d2c55b1cb?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.7,
    reviewCount: 980,
    points: 250,
    status: "Activo",
    description:
      "El monumento más reconocible de la Barranquilla contemporánea. Su estructura colorida en la Circunvalar se ha convertido en la parada fotográfica obligatoria de quien llega a la ciudad y en símbolo de su apertura al Caribe.",
    location: "Barranquilla, CO",
    address: "Calle 84 con Circunvalar, Barranquilla",
    lat: 11.0201,
    lng: -74.8087,
    schedule: {
      isOpenNow: true,
      hours: [{ day: "Lunes - Domingo", time: "Abierto 24 h" }],
    },
  },
  {
    id: 2,
    name: "Gran Malecón del Río",
    category: "Naturaleza",
    image:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.8,
    reviewCount: 1520,
    points: 200,
    status: "Activo",
    description:
      "Cinco kilómetros de paseo junto al río Magdalena, con miradores, ciclorruta, gastronomía y espacios culturales. Es el proyecto que devolvió el río a los barranquilleros y el mejor sitio para ver el atardecer.",
    location: "Barranquilla, CO",
    address: "Vía 40, Barranquilla",
    lat: 11.0344,
    lng: -74.7749,
    schedule: {
      isOpenNow: true,
      hours: [
        { day: "Lunes - Jueves", time: "05:00 - 22:00" },
        { day: "Viernes - Domingo", time: "05:00 - 00:00" },
      ],
    },
  },
  {
    id: 3,
    name: "Museo del Caribe",
    category: "Cultura",
    image:
      "https://images.unsplash.com/photo-1554907984-15263bfd63bd?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1554907984-15263bfd63bd?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566127992631-137a642a90f4?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.6,
    reviewCount: 870,
    points: 220,
    status: "Activo",
    description:
      "El corazón del Parque Cultural del Caribe. Recorre la naturaleza, la gente, la palabra y la expresión de toda la región caribe colombiana, con una sala dedicada a Gabriel García Márquez.",
    location: "Barranquilla, CO",
    address: "Calle 36 #46-66, Barrio Abajo, Barranquilla",
    lat: 10.9861,
    lng: -74.7897,
    schedule: {
      isOpenNow: true,
      hours: [
        { day: "Martes - Viernes", time: "08:00 - 17:00" },
        { day: "Sábado - Domingo", time: "09:00 - 18:00" },
      ],
    },
  },
  {
    id: 4,
    name: "Catedral Metropolitana María Reina",
    category: "Religiosa",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.5,
    reviewCount: 640,
    points: 150,
    status: "Activo",
    description:
      "Obra de arquitectura moderna que rompe con la tradición colonial. Destaca el Cristo suspendido sobre el altar y sus vitrales, que filtran la luz del Caribe sobre la nave.",
    location: "Barranquilla, CO",
    address: "Carrera 45 #53-140, Barranquilla",
    lat: 10.9944,
    lng: -74.7906,
    schedule: {
      isOpenNow: true,
      hours: [
        { day: "Lunes - Sábado", time: "07:00 - 18:00" },
        { day: "Domingo", time: "07:00 - 20:00" },
      ],
    },
  },
  {
    id: 5,
    name: "Zoológico de Barranquilla",
    category: "Naturaleza",
    image:
      "https://images.unsplash.com/photo-1466692476869-aef1dfb1e735?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1466692476869-aef1dfb1e735?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.3,
    reviewCount: 1100,
    points: 180,
    status: "Activo",
    description:
      "Centro de conservación con especies del Caribe colombiano y programas de reproducción de fauna amenazada, como el mono tití cabeciblanco.",
    location: "Barranquilla, CO",
    address: "Calle 77 #68-40, Barranquilla",
    lat: 11.0042,
    lng: -74.8047,
    schedule: {
      isOpenNow: true,
      hours: [{ day: "Martes - Domingo", time: "09:00 - 17:00" }],
    },
  },
  {
    id: 6,
    name: "La Cueva",
    category: "Gastronomía",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.6,
    reviewCount: 720,
    points: 190,
    status: "Activo",
    description:
      "Antigua taberna de cazadores convertida en museo y restaurante. Aquí se reunía el Grupo de Barranquilla en torno a García Márquez, Alejandro Obregón y Álvaro Cepeda Samudio. Cocina caribeña rodeada de memoria literaria.",
    location: "Barranquilla, CO",
    address: "Carrera 43 #59-03, Barranquilla",
    lat: 11.0011,
    lng: -74.8014,
    schedule: {
      isOpenNow: true,
      hours: [
        { day: "Lunes - Sábado", time: "12:00 - 00:00" },
        { day: "Domingo", time: "12:00 - 18:00" },
      ],
    },
  },
  {
    id: 7,
    name: "Castillo de Salgar",
    category: "Cultura",
    image:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.4,
    reviewCount: 530,
    points: 280,
    status: "Activo",
    description:
      "Fortificación del siglo XIX levantada frente al mar en Puerto Colombia. Fue puesto militar, aduana y hasta hotel; hoy es mirador y restaurante con una de las mejores vistas del litoral.",
    location: "Puerto Colombia, CO",
    address: "Vía Salgar, Puerto Colombia, Atlántico",
    lat: 11.0069,
    lng: -74.9483,
    schedule: {
      isOpenNow: true,
      hours: [{ day: "Miércoles - Domingo", time: "10:00 - 22:00" }],
    },
  },
  {
    id: 8,
    name: "Bocas de Ceniza",
    category: "Naturaleza",
    image:
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.5,
    reviewCount: 610,
    points: 320,
    status: "Pendiente",
    description:
      "El punto donde el río Magdalena desemboca en el mar Caribe y ambas aguas se distinguen por su color. Se llega en un tren artesanal que recorre el tajamar occidental.",
    location: "Barranquilla, CO",
    address: "Tajamar Occidental, Barranquilla",
    lat: 11.1097,
    lng: -74.8511,
    schedule: {
      isOpenNow: false,
      hours: [{ day: "Sábado - Domingo", time: "08:00 - 16:00" }],
    },
  },
  {
    id: 9,
    name: "Teatro Amira de la Rosa",
    category: "Cultura",
    image:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1566127992631-137a642a90f4?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.4,
    reviewCount: 380,
    points: 160,
    status: "Activo",
    description:
      "La principal sala escénica de la ciudad, nombrada en honor a la dramaturga barranquillera. Programa teatro, danza y conciertos, y es sede habitual de los eventos culturales del Carnaval.",
    location: "Barranquilla, CO",
    address: "Carrera 54 #52-258, Barranquilla",
    lat: 10.9917,
    lng: -74.7869,
    schedule: {
      isOpenNow: true,
      hours: [{ day: "Martes - Domingo", time: "Según programación" }],
    },
  },
  {
    id: 10,
    name: "Centro Comercial Buenavista",
    category: "Compras",
    image:
      "https://images.unsplash.com/photo-1519567241348-e6a0d1a2e4d3?q=80&w=600&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1519567241348-e6a0d1a2e4d3?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555992336-fb0d2c55b1cb?q=80&w=600&auto=format&fit=crop",
    ],
    rating: 4.4,
    reviewCount: 1340,
    points: 100,
    status: "Inactivo",
    description:
      "Uno de los centros comerciales de referencia del norte de la ciudad, con tiendas, zona de restaurantes y cines. Punto de encuentro habitual para escapar del calor del mediodía.",
    location: "Barranquilla, CO",
    address: "Calle 98 #52-115, Barranquilla",
    lat: 11.0089,
    lng: -74.8103,
    schedule: {
      isOpenNow: true,
      hours: [{ day: "Lunes - Domingo", time: "10:00 - 21:00" }],
    },
  },
];
