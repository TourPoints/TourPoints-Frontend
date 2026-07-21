import { mockChallenges } from "../mocks/challenges.js";
import { createCrudService } from "./createCrudService.js";
import { apiGet, apiGetItems, apiPost, apiPatch, isApiEnabled, ApiError } from "./api.client.js";

// Servicio de Retos. Cableado al backend real (docs/CABLEADO.md).
//
// El modelo del backend es más rico que el del frontend (recurrencia,
// cantidad_requerida, modo de recompensa, periodos): el adaptador lo proyecta
// al modelo de tarjeta existente y deriva lo que la vista espera:
//   - difficulty: de cantidad_requerida (1 = Fácil, 2-3 = Medio, 4+ = Difícil)
//   - points: los de la recompensa asociada (si no hay, 0)
//   - deadline: el fin de la vigencia
//   - image: ilustración fija por tipo — sus retos no tienen imagen (pedida
//     en la bitácora como decisión B3)
//
// Escrituras del panel admin: crear y activar/cancelar existen en su API;
// editar y borrar retos NO tienen endpoint todavía — quedan anotados como
// pendiente del backend y aquí degradan sin fingir.

export const CHALLENGE_STATUSES = ["Activo", "Pendiente", "Inactivo"];

const service = createCrudService({
  collection: "challenges",
  seed: mockChallenges,
  idPrefix: "CHL",
  apiPath: "/admin/challenges",
  defaults: { status: "Pendiente" },
  numericFields: ["points"],
});

// Ilustraciones por tipo de reto (Unsplash, mismos placeholders del proyecto).
const TYPE_IMAGES = {
  VISITA: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&h=400&fit=crop",
  COMPRA: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
  RECORRIDO: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
};

const TYPE_LABELS = { VISITA: "Visita", COMPRA: "Compra", RECORRIDO: "Recorrido" };
const RECURRENCIA_LABELS = { UNICA: "única", DIARIA: "diaria", SEMANAL: "semanal", MENSUAL: "mensual" };

const difficultyFrom = (cantidad) => (cantidad <= 1 ? "Fácil" : cantidad <= 3 ? "Medio" : "Difícil");

const mapEstado = (estado) =>
  estado === "ACTIVO" ? "Activo" : estado === "BORRADOR" ? "Pendiente" : "Inactivo";

/** RetoListItem/RetoDetail del backend → modelo de tarjeta del frontend. */
function adaptReto(r) {
  const cantidad = Number(r.cantidad_requerida) || 1;
  const descripcion =
    r.descripcion ??
    // El listado no trae descripción: se compone una línea honesta con los
    // datos reales del reto en vez de dejar la tarjeta muda.
    `Completa ${cantidad} ${cantidad === 1 ? "objetivo" : "objetivos"} de tipo ${
      TYPE_LABELS[r.tipo] ?? r.tipo
    } (recurrencia ${RECURRENCIA_LABELS[r.recurrencia] ?? "única"}).`;

  return {
    id: r.id,
    name: r.nombre,
    type: TYPE_LABELS[r.tipo] ?? r.tipo,
    difficulty: difficultyFrom(cantidad),
    status: mapEstado(r.estado),
    points: Number(r.recompensa?.puntos) || 0,
    deadline: (r.fin ?? "").slice(0, 10),
    image: TYPE_IMAGES[r.tipo] ?? TYPE_IMAGES.VISITA,
    description: descripcion,
    // Datos del modelo rico que las vistas pueden aprovechar.
    cantidadRequerida: cantidad,
    recurrencia: r.recurrencia,
    modoRecompensa: r.modo_recompensa,
    recompensaNombre: r.recompensa?.nombre ?? null,
    disponible: r.disponible !== false,
  };
}

/** Lista los retos. */
export async function getChallenges() {
  if (isApiEnabled("challenges")) {
    const items = await apiGetItems("/challenges");
    return items.map(adaptReto);
  }
  return service.list();
}

/** Detalle de un reto (con la descripción real en el backend). */
export async function getChallengeById(id) {
  if (isApiEnabled("challenges")) {
    try {
      return adaptReto(await apiGet(`/challenges/${id}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
  return service.getById(id);
}

/**
 * Crea un reto. El formulario del admin habla el modelo viejo (dificultad,
 * fecha límite): se proyecta al suyo con la derivación inversa a la del
 * adaptador. Nace como reto de VISITA de recurrencia única sin recompensa,
 * que es lo único expresable desde el formulario actual.
 */
export async function createChallenge(data) {
  if (isApiEnabled("challenges")) {
    const cantidad = data.difficulty === "Fácil" ? 1 : data.difficulty === "Medio" ? 2 : 4;
    const creado = await apiPost("/challenges", {
      nombre: data.name,
      descripcion: data.description ?? null,
      tipo: "VISITA",
      recurrencia: "UNICA",
      cantidad_requerida: cantidad,
      modo_recompensa: "SIN_RECOMPENSA",
      recompensa_id: null,
      inicio: new Date().toISOString(),
      fin: data.deadline ? `${data.deadline}T23:59:59-05:00` : null,
      configuracion: {},
    });
    return adaptReto(creado);
  }
  return service.create(data);
}

// Inverso de mapEstado: hay que cubrir los tres valores, no solo
// Activo/no-Activo. El desplegable de estado del panel ofrece "Pendiente"
// como opción real (igual que en POIs y recompensas) — con un mapeo binario,
// elegirla habría cancelado el reto en silencio en vez de devolverlo a
// borrador.
const toEstadoReto = (status) =>
  status === "Activo" ? "ACTIVO" : status === "Pendiente" ? "BORRADOR" : "CANCELADO";

async function setChallengeEstado(id, status) {
  await apiPatch(`/challenges/${id}/moderation`, { estado: toEstadoReto(status) });
  return getChallengeById(id);
}

/**
 * Edita un reto. ⚠️ El backend no expone PATCH /challenges/{id} todavía:
 * en modo API solo aplican los cambios de estado (vía moderación); el resto
 * se ignora con aviso, para no fingir una edición que no ocurrió.
 */
export async function updateChallenge(id, changes) {
  if (isApiEnabled("challenges")) {
    if (changes.status !== undefined) return setChallengeEstado(id, changes.status);
    console.warn("Editar retos aún no tiene endpoint en el backend; cambio ignorado.");
    return getChallengeById(id);
  }
  return service.update(id, changes);
}

/**
 * Borra un reto. ⚠️ Sin DELETE en su API: en modo API se cancela vía
 * moderación, que es su equivalente de baja.
 */
export async function deleteChallenge(id) {
  if (isApiEnabled("challenges")) {
    try {
      await apiPatch(`/challenges/${id}/moderation`, { estado: "CANCELADO" });
      return true;
    } catch (error) {
      console.error("No se pudo cancelar el reto:", error);
      return false;
    }
  }
  return service.remove(id);
}

/** Alterna Activo/Inactivo (moderación ACTIVO/CANCELADO en el backend). */
export async function toggleChallengeStatus(id) {
  if (isApiEnabled("challenges")) {
    const actual = await getChallengeById(id);
    if (!actual) return null;
    return setChallengeEstado(id, actual.status === "Activo" ? "Inactivo" : "Activo");
  }
  return service.toggleStatus(id, ["Activo", "Inactivo"]);
}
