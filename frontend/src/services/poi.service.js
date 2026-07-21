import { mockPois } from "../mocks/pois.js";
import {
  apiGet,
  apiGetItems,
  apiPost,
  apiPatch,
  apiDelete,
  apiPostForm,
  isApiEnabled,
  ApiError,
} from "./api.client.js";
import { readCollection, writeCollection, nextNumericId } from "./localStore.js";

// Servicio de Puntos de Interés. Cableado al backend real (docs/CABLEADO.md).
//
// Con "pois" en API_MODULES habla con /api/v1/poi; sin backend, opera sobre
// localStorage sembrado con los mocks. Las vistas usan siempre esta misma
// interfaz: no saben de dónde salen los datos.
//
// El backend expone la búsqueda geoespacial (lat/lng/radio_metros) y devuelve
// distancia_metros calculada con PostGIS: el mapa la usa en vez de calcular
// Haversine en el cliente.

const COLLECTION = "pois";

/** Estados posibles de un POI. Solo los "Activo" se muestran al público. */
export const POI_STATUSES = ["Activo", "Pendiente", "Inactivo"];
export const PUBLISHED_STATUS = "Activo";

// ── Adaptación del contrato real ──────────────────────────────

// El POI del backend no trae puntos por visita (los decide reglas_puntos al
// validar el check-in; la petición B1 de exponer un `puntos_visita` calculado
// sigue abierta). Mientras tanto la tarjeta necesita un número que prometer:
// este espejo replica las reglas sembradas en scripts/seed_data.sql. Si el
// equipo backend cambia las reglas, este mapa y aquel seed cambian juntos.
const CATEGORY_POINTS = {
  Cultura: 220,
  Naturaleza: 200,
  "Gastronomía": 190,
  Religiosa: 150,
};
const SLUG_POINTS = { "bocas-de-ceniza": 320 };
const BASE_POINTS = 100;

const pointsFor = (slug, categoria) =>
  SLUG_POINTS[slug] ?? CATEGORY_POINTS[categoria] ?? BASE_POINTS;

/** Sus estados de moderación → los del frontend. */
const mapEstado = (estado) =>
  estado === "APROBADO" ? "Activo" : estado === "PENDIENTE" ? "Pendiente" : "Inactivo";

/** Los del frontend → los suyos (para el PATCH de moderación). */
const toEstado = (status) =>
  status === "Activo" ? "APROBADO" : status === "Pendiente" ? "PENDIENTE" : "INACTIVO";

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Traduce el JSONB de horarios ({"lunes":["08:00","18:00"]} o
 * {"todos_los_dias":[...]}) al modelo de la vista de detalle, calculando
 * "abierto ahora" contra la hora local del visitante.
 */
function adaptSchedule(horarios = {}) {
  const entries = Object.entries(horarios).filter(([, v]) => Array.isArray(v) && v.length === 2);
  const hours = entries.map(([dia, [desde, hasta]]) => ({
    day: dia === "todos_los_dias" ? "Lunes - Domingo" : capitalizar(dia),
    time: `${desde} - ${hasta}`,
  }));

  const hoy = DIAS[new Date().getDay()];
  const franja = horarios[hoy] ?? horarios.todos_los_dias;
  let isOpenNow = false;
  if (Array.isArray(franja) && franja.length === 2) {
    const ahora = new Date().toTimeString().slice(0, 5);
    isOpenNow = ahora >= franja[0] && ahora <= franja[1];
  }

  return { isOpenNow, hours: hours.length ? hours : [{ day: "Horario", time: "Según programación" }] };
}

/** PoiListItem del backend → tarjeta del frontend. */
function adaptPoiListItem(p) {
  return {
    id: p.id,
    name: p.nombre,
    slug: p.slug,
    category: p.categoria?.nombre ?? "Otros",
    categoryColor: p.categoria?.color ?? null,
    image: p.imagen_principal ?? "https://images.unsplash.com/photo-1583997052103-b4a1cb974ce5?q=80&w=600&auto=format&fit=crop",
    rating: Number(p.calificacion_promedio) || 0,
    reviewCount: Number(p.total_calificaciones) || 0,
    points: pointsFor(p.slug, p.categoria?.nombre),
    status: "Activo", // el listado público solo devuelve APROBADO
    description: "", // el resumen del backend no trae descripción; el detalle sí
    location: `${p.ciudad?.nombre ?? "Barranquilla"}, CO`,
    lat: p.ubicacion?.lat,
    lng: p.ubicacion?.lng,
    // PostGIS responde en metros; el frontend razona en kilómetros.
    ...(p.distancia_metros != null ? { distance: p.distancia_metros / 1000 } : {}),
  };
}

/** PoiDetail del backend → detalle del frontend. */
function adaptPoiDetail(p) {
  const imagenes = [...(p.imagenes ?? [])].sort((a, b) => a.orden - b.orden);
  const principal = imagenes.find((i) => i.principal) ?? imagenes[0];
  return {
    ...adaptPoiListItem(p),
    description: p.descripcion ?? "",
    address: p.direccion ?? "",
    image: principal?.url ?? adaptPoiListItem(p).image,
    images: imagenes.map((i) => i.url),
    schedule: adaptSchedule(p.horarios),
    status: mapEstado(p.estado),
    telefono: p.telefono ?? null,
    sitio_web: p.sitio_web ?? null,
    radio_validacion: p.radio_validacion,
  };
}

// Catálogo de categorías (id ↔ nombre) para traducir el formulario del admin.
let categoriasCache = null;
async function getCategoriaId(nombre) {
  if (!categoriasCache) categoriasCache = await apiGetItems("/poi-categories");
  return categoriasCache.find((c) => c.nombre === nombre)?.id ?? null;
}

// ── Lecturas públicas ─────────────────────────────────────────

/**
 * Devuelve los POIs visibles para el público: solo los publicados.
 * La usan el mapa y la vista de exploración.
 * @param {Object} [filters] - { query, category, lat, lng, radiusM }
 * @returns {Promise<Array>} POIs publicados (con `distance` en km si se
 *   enviaron coordenadas: la calcula PostGIS en el servidor).
 */
export async function getPois(filters = {}) {
  if (isApiEnabled("pois")) {
    const items = await apiGetItems("/poi", {
      nombre: filters.query,
      lat: filters.lat,
      lng: filters.lng,
      radio_metros: filters.radiusM,
    });
    return items.map(adaptPoiListItem);
  }

  return readCollection(COLLECTION, mockPois).filter(
    (poi) => poi.status === PUBLISHED_STATUS
  );
}

/**
 * POIs cercanos a unas coordenadas, ordenados por distancia real de PostGIS.
 * @param {{lat: number, lng: number}} coords - Ubicación del usuario.
 * @param {number} [radiusM=15000] - Radio de búsqueda en metros.
 */
export async function getPoisNearby(coords, radiusM = 15000) {
  return getPois({ lat: coords.lat, lng: coords.lng, radiusM });
}

/**
 * Obtiene los detalles de un POI por su ID.
 * @param {number|string} id - ID del POI.
 * @returns {Promise<Object|null>} El POI, o null si no existe.
 */
export async function getPoiById(id) {
  if (isApiEnabled("pois")) {
    try {
      return adaptPoiDetail(await apiGet(`/poi/${id}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  const poi = readCollection(COLLECTION, mockPois).find(
    (item) => String(item.id) === String(id)
  );
  return poi ? { ...poi } : null;
}

// ── Panel de administración ───────────────────────────────────

/**
 * Devuelve todos los POIs sin importar su estado. Uso exclusivo del panel.
 * El backend filtra por un estado a la vez, así que se piden los cuatro en
 * paralelo y se concatenan.
 */
export async function getAllPois() {
  if (isApiEnabled("pois")) {
    const estados = ["APROBADO", "PENDIENTE", "BORRADOR", "INACTIVO"];
    const listas = await Promise.all(
      estados.map((e) => apiGetItems("/poi", { estado: e }).catch(() => []))
    );
    const vistos = new Set();
    return listas.flat().filter((p) => !vistos.has(p.id) && vistos.add(p.id))
      .map((p) => ({ ...adaptPoiListItem(p), status: mapEstado(p.estado ?? "APROBADO") }));
  }

  return readCollection(COLLECTION, mockPois);
}

/** Campos del formulario del admin → PoiCreate/PoiUpdate del backend. */
async function toBackendPoi(data) {
  const body = {};
  if (data.name !== undefined) body.nombre = data.name;
  if (data.description !== undefined) body.descripcion = data.description;
  if (data.address !== undefined) body.direccion = data.address;
  if (data.lat !== undefined && data.lng !== undefined) {
    body.ubicacion = { lat: Number(data.lat), lng: Number(data.lng) };
  }
  if (data.category !== undefined) {
    const id = await getCategoriaId(data.category);
    if (id) body.categoria_id = id;
  }
  if (data.location !== undefined) {
    // El formulario escribe la ciudad como texto; el backend la referencia.
    body.ciudad_id = /puerto colombia/i.test(data.location) ? 2 : 1;
  }
  return body;
}

/**
 * Sube una imagen para un POI y la marca como principal. Su endpoint no
 * acepta URLs de texto: el archivo va por multipart, el backend lo sube a
 * Cloudinary y devuelve la URL resultante. Por eso el campo de imagen del
 * formulario del admin es un `<input type="file">`, no un campo de texto.
 * @param {string} poiId
 * @param {File} file
 * @returns {Promise<{ok: boolean, url?: string, error?: string}>}
 */
export async function uploadPoiImage(poiId, file) {
  if (!isApiEnabled("pois")) {
    return { ok: false, error: "La subida de imágenes estará disponible cuando el backend esté conectado." };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("principal", "true");

  try {
    const imagen = await apiPostForm(`/poi/${poiId}/images`, formData);
    return { ok: true, url: imagen.url };
  } catch (error) {
    const detalle = typeof error.detail === "string" ? error.detail : null;
    return { ok: false, error: detalle ?? "No pudimos subir la imagen. Inténtalo de nuevo." };
  }
}

/**
 * Crea un POI. Contra el backend el alta nace BORRADOR y se encadena el flujo
 * de moderación (enviar a revisión → aprobar) para que quede en el estado que
 * el formulario pidió. Si el formulario trajo una imagen, se sube justo
 * después de crear el POI (recién ahí existe el id que pide su endpoint).
 */
export async function createPoi(data) {
  if (isApiEnabled("pois")) {
    const creado = await apiPost("/poi", await toBackendPoi(data));

    if (data.image instanceof File && data.image.size > 0) {
      const subida = await uploadPoiImage(creado.id, data.image);
      if (!subida.ok) console.warn("POI creado; la subida de imagen falló:", subida.error);
    }

    const target = toEstado(data.status ?? "Pendiente");
    try {
      if (target !== "BORRADOR") await apiPost(`/poi/${creado.id}/submit-for-review`);
      if (target === "APROBADO" || target === "INACTIVO") {
        await apiPatch(`/poi/${creado.id}/moderation`, { estado: "APROBADO" });
        if (target === "INACTIVO") await apiPatch(`/poi/${creado.id}/moderation`, { estado: "INACTIVO" });
      }
    } catch (error) {
      // Si la moderación falla, el POI existe igualmente (quedó PENDIENTE):
      // el refresco del panel lo mostrará en su estado real.
      console.warn("POI creado; la transición de estado falló:", error);
    }
    return adaptPoiDetail(await apiGet(`/poi/${creado.id}`));
  }

  const pois = readCollection(COLLECTION, mockPois);
  const poi = {
    ...data,
    id: nextNumericId(pois),
    rating: Number(data.rating) || 0,
    reviewCount: 0,
    points: Number(data.points) || 0,
    lat: Number(data.lat),
    lng: Number(data.lng),
    images: data.image ? [data.image] : [],
  };
  writeCollection(COLLECTION, [...pois, poi]);
  return poi;
}

/**
 * Actualiza un POI existente.
 * @returns {Promise<Object|null>} El POI actualizado, o null si no existe.
 */
export async function updatePoi(id, changes) {
  if (isApiEnabled("pois")) {
    try {
      const body = await toBackendPoi(changes);
      await apiPatch(`/poi/${id}`, body);

      if (changes.image instanceof File && changes.image.size > 0) {
        const subida = await uploadPoiImage(id, changes.image);
        if (!subida.ok) console.warn("POI actualizado; la subida de imagen falló:", subida.error);
      }

      // El cambio de estado va por el endpoint de moderación, no por el PATCH.
      if (changes.status !== undefined) {
        await apiPatch(`/poi/${id}/moderation`, { estado: toEstado(changes.status) }).catch((e) =>
          console.warn("Transición de estado rechazada:", e?.detail ?? e)
        );
      }
      return adaptPoiDetail(await apiGet(`/poi/${id}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  const pois = readCollection(COLLECTION, mockPois);
  const index = pois.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;

  const updated = {
    ...pois[index],
    ...changes,
    id: pois[index].id,
    points: changes.points !== undefined ? Number(changes.points) : pois[index].points,
    rating: changes.rating !== undefined ? Number(changes.rating) : pois[index].rating,
    lat: changes.lat !== undefined ? Number(changes.lat) : pois[index].lat,
    lng: changes.lng !== undefined ? Number(changes.lng) : pois[index].lng,
  };
  pois[index] = updated;
  writeCollection(COLLECTION, pois);
  return updated;
}

/**
 * Elimina un POI.
 * @returns {Promise<boolean>} true si se eliminó algo.
 */
export async function deletePoi(id) {
  if (isApiEnabled("pois")) {
    try {
      await apiDelete(`/poi/${id}`);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return false;
      throw error;
    }
  }

  const pois = readCollection(COLLECTION, mockPois);
  const remaining = pois.filter((item) => String(item.id) !== String(id));
  if (remaining.length === pois.length) return false;
  writeCollection(COLLECTION, remaining);
  return true;
}

/**
 * Alterna el estado de un POI entre Activo e Inactivo (vía moderación en API).
 */
export async function togglePoiStatus(id) {
  const poi = await getPoiById(id);
  if (!poi) return null;

  const nextStatus = poi.status === PUBLISHED_STATUS ? "Inactivo" : PUBLISHED_STATUS;

  if (isApiEnabled("pois")) {
    await apiPatch(`/poi/${id}/moderation`, { estado: toEstado(nextStatus) });
    return { ...poi, status: nextStatus };
  }

  return updatePoi(id, { status: nextStatus });
}
