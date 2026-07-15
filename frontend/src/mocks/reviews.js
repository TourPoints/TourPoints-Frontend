// Datos semilla de reseñas, indexados por id de POI.
//
// Cada reseña corresponde al POI real al que está asociada en mocks/pois.js:
// hasta el re-seed a Barranquilla (496b9b3) este archivo se quedó hablando de
// Madrid, así que "Ventana al Mundo" mostraba comentarios sobre el Real Jardín
// Botánico. Al tocar los POIs hay que tocar también estas reseñas.
//
// Las fechas se calculan en vez de fijarse a mano para que la semilla nazca
// reciente en cualquier momento, en lugar de mostrar "Hace 2 años" a quien
// abra la app dentro de un tiempo. Quedan ancladas cuando review.service
// siembra la colección en localStorage, y envejecen desde ahí como cualquier
// comentario real. Se guardan en ISO, el mismo formato que escribe el servicio
// para los comentarios de usuario: semilla y contenido real comparten modelo.

/**
 * Instante ISO de hace N días, para las fechas de la semilla.
 * @param {number} days - Días hacia atrás.
 * @param {number} [hours=0] - Horas adicionales hacia atrás.
 * @returns {string} Fecha en ISO 8601.
 */
const daysAgo = (days, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();

export const mockReviews = {
  // 1 · Ventana al Mundo (Cultura)
  1: [
    { id: "REV-001", author: "Ana Martínez", initials: "AM", rating: 5, text: "El monumento se ve espectacular al atardecer, cuando se encienden las luces. Parada obligatoria si es tu primera vez en la ciudad.", createdAt: daysAgo(2) },
    { id: "REV-002", author: "Juan López", initials: "JL", rating: 4, text: "Muy buena foto, aunque hay poca sombra alrededor. Ve temprano o después de las cinco: el sol de la Circunvalar es fuerte.", createdAt: daysAgo(6) },
    { id: "REV-003", author: "Laura García", initials: "LG", rating: 5, text: "Símbolo de Barranquilla. Los colores se ven aún mejor en persona que en las fotos.", createdAt: daysAgo(15) },
  ],

  // 2 · Gran Malecón del Río (Naturaleza)
  2: [
    { id: "REV-004", author: "Carlos Ruiz", initials: "CR", rating: 5, text: "Cinco kilómetros junto al Magdalena impecables. Ideal para caminar o montar bicicleta al final de la tarde.", createdAt: daysAgo(1) },
    { id: "REV-005", author: "María Sánchez", initials: "MS", rating: 5, text: "Los food trucks del sector son buenísimos y hay espacio de sobra para los niños. Vamos casi cada fin de semana.", createdAt: daysAgo(4) },
    { id: "REV-006", author: "Diego Barraza", initials: "DB", rating: 4, text: "Muy bien cuidado e iluminado. Los fines de semana se llena bastante, entre semana se disfruta más.", createdAt: daysAgo(9) },
  ],

  // 3 · Museo del Caribe (Cultura)
  3: [
    { id: "REV-007", author: "Pedro Fernández", initials: "PF", rating: 5, text: "La sala dedicada a García Márquez vale la entrada por sí sola. Muy bien montado y con mucho que leer.", createdAt: daysAgo(3) },
    { id: "REV-008", author: "Elena Torres", initials: "ET", rating: 4, text: "Recorrido interesante sobre la cultura caribeña. Calcula unas dos horas para verlo con calma.", createdAt: daysAgo(8) },
  ],

  // 4 · Catedral Metropolitana María Reina (Religiosa)
  4: [
    { id: "REV-009", author: "Roberto Díaz", initials: "RD", rating: 5, text: "La arquitectura moderna sorprende: nada que ver con una catedral tradicional. El Cristo suspendido es impresionante.", createdAt: daysAgo(5) },
    { id: "REV-010", author: "Isabel Moreno", initials: "IM", rating: 4, text: "Un espacio de recogimiento en pleno centro. Conviene consultar los horarios de misa antes de ir.", createdAt: daysAgo(12) },
  ],

  // 5 · Zoológico de Barranquilla (Naturaleza)
  5: [
    { id: "REV-011", author: "David Herrera", initials: "DH", rating: 4, text: "Buen plan en familia. Los espacios de fauna del Caribe colombiano están muy bien explicados.", createdAt: daysAgo(2, 6) },
    { id: "REV-012", author: "Carmen Vega", initials: "CV", rating: 4, text: "Ve temprano para evitar el calor del mediodía. Lleva agua y gorra, se camina bastante.", createdAt: daysAgo(7) },
  ],

  // 6 · La Cueva (Gastronomía)
  6: [
    { id: "REV-013", author: "Sofía Navarro", initials: "SN", rating: 5, text: "Comer donde se reunía el Grupo de Barranquilla es una experiencia en sí misma. La historia se respira en las paredes.", createdAt: daysAgo(4) },
    { id: "REV-014", author: "Andrés Movilla", initials: "AM", rating: 4, text: "Ambiente único y buena cocina caribeña. Reserva si vas en fin de semana.", createdAt: daysAgo(11) },
  ],

  // 7 · Castillo de Salgar (Cultura · Puerto Colombia)
  7: [
    { id: "REV-015", author: "Miguel Ángel Ruiz", initials: "MR", rating: 5, text: "Las vistas al mar desde la fortaleza son inmejorables, sobre todo al atardecer. Merece el viaje hasta Puerto Colombia.", createdAt: daysAgo(3, 4) },
    { id: "REV-016", author: "Patricia Gil", initials: "PG", rating: 4, text: "Construcción del siglo XIX muy bien conservada. El restaurante de al lado es buena opción para cerrar la tarde.", createdAt: daysAgo(10) },
  ],

  // 8 · Bocas de Ceniza (Naturaleza)
  8: [
    { id: "REV-017", author: "Francisco Luna", initials: "FL", rating: 5, text: "Ver el Magdalena entrar al mar no se parece a nada. El recorrido en el planchón es parte de la aventura.", createdAt: daysAgo(1, 8) },
    { id: "REV-018", author: "Rosa Mendoza", initials: "RM", rating: 4, text: "Experiencia distinta, pero ve con calzado cómodo y pregunta por el clima antes: el viento pega duro.", createdAt: daysAgo(6, 12) },
  ],

  // 9 · Teatro Amira de la Rosa (Cultura)
  9: [
    { id: "REV-019", author: "Alberto Cruz", initials: "AC", rating: 4, text: "Sala con muy buena acústica y una programación cultural sólida. Consulta la cartelera antes de ir.", createdAt: daysAgo(5, 3) },
  ],

  // 10 · Centro Comercial Buenavista (Compras)
  10: [
    { id: "REV-020", author: "Natalia Pérez", initials: "NP", rating: 4, text: "Amplio, cómodo y con buena zona de comidas. Ideal para refugiarse del calor un rato.", createdAt: daysAgo(2, 2) },
    { id: "REV-021", author: "Jorge Sarmiento", initials: "JS", rating: 4, text: "Buena variedad de tiendas y parqueadero suficiente. Los fines de semana se congestiona la entrada.", createdAt: daysAgo(13) },
  ],
};
