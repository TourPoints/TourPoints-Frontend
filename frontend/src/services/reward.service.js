import { mockRewards } from "../mocks/rewards.js";
import { createCrudService } from "./createCrudService.js";
import { apiGet, apiGetItems, apiPost, apiPatch, isApiEnabled, ApiError } from "./api.client.js";

// Servicio de Recompensas. Cableado al backend real (docs/CABLEADO.md).
//
// Contra la API (siempre con sesión: hasta el listado exige token):
//   GET   /rewards                → catálogo (usuario ve solo APROBADO)
//   POST  /rewards                → crear (admin)
//   PATCH /rewards/{id}           → editar / cambiar estado (admin)
//   POST  /rewards/{id}/redeem    → canjear por puntos → canje con código QR
//
// Su modelo no tiene imagen, emoji ni categoría (decisión B3 pendiente en la
// bitácora): el adaptador deja el emoji genérico y sin categoría — la página
// las muestra bajo "Todos". Borrar tampoco existe: la baja es PATCH a
// INACTIVO, que es su equivalente real.

export const REWARD_STATUSES = ["Activo", "Pendiente", "Inactivo"];

const service = createCrudService({
  collection: "rewards",
  seed: mockRewards,
  idPrefix: "REW",
  apiPath: "/admin/rewards",
  defaults: { status: "Pendiente", emoji: "🎁" },
  numericFields: ["pointsCost", "stock"],
});

const mapEstado = (estado) =>
  estado === "APROBADO" ? "Activo" : estado === "PENDIENTE" ? "Pendiente" : "Inactivo";

const toEstado = (status) =>
  status === "Activo" ? "APROBADO" : status === "Pendiente" ? "PENDIENTE" : "INACTIVO";

/** RecompensaOut del backend → modelo de tarjeta del frontend. */
function adaptRecompensa(r) {
  return {
    id: r.id,
    name: r.nombre,
    description: r.descripcion ?? "",
    pointsCost: Number(r.puntos) || 0,
    stock: Number(r.stock) || 0,
    status: mapEstado(r.estado),
    emoji: "🎁",
    image: null,
    category: undefined, // sin categoría en su modelo: aparece bajo "Todos"
    poiId: r.poi_id ?? null,
    disponible: r.disponible !== false,
  };
}

/** Campos del formulario admin → RecompensaCreate/Update del backend. */
function toBackendReward(data) {
  const body = {};
  if (data.name !== undefined) body.nombre = data.name;
  if (data.description !== undefined) body.descripcion = data.description;
  if (data.stock !== undefined) body.stock = Number(data.stock);
  if (data.pointsCost !== undefined) body.puntos = Number(data.pointsCost);
  return body;
}

/** Lista las recompensas (vacía si la sesión no alcanza). */
export async function getRewards() {
  if (isApiEnabled("rewards")) {
    try {
      const items = await apiGetItems("/rewards");
      return items.map(adaptRecompensa);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return [];
      throw error;
    }
  }
  return service.list();
}

export async function getRewardById(id) {
  if (isApiEnabled("rewards")) {
    try {
      return adaptRecompensa(await apiGet(`/rewards/${id}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
  return service.getById(id);
}

export async function createReward(data) {
  if (isApiEnabled("rewards")) {
    const creado = await apiPost("/rewards", { ...toBackendReward(data), poi_id: null });
    // El backend crea en APROBADO; si el formulario pidió otro estado, se aplica.
    const target = toEstado(data.status ?? "Activo");
    if (target !== "APROBADO") {
      await apiPatch(`/rewards/${creado.id}`, { estado: target }).catch(() => {});
    }
    return getRewardById(creado.id);
  }
  return service.create(data);
}

export async function updateReward(id, changes) {
  if (isApiEnabled("rewards")) {
    const body = toBackendReward(changes);
    if (changes.status !== undefined) body.estado = toEstado(changes.status);
    await apiPatch(`/rewards/${id}`, body);
    return getRewardById(id);
  }
  return service.update(id, changes);
}

/** Sin DELETE en su API: la baja real es pasarla a INACTIVO. */
export async function deleteReward(id) {
  if (isApiEnabled("rewards")) {
    try {
      await apiPatch(`/rewards/${id}`, { estado: "INACTIVO" });
      return true;
    } catch (error) {
      console.error("No se pudo dar de baja la recompensa:", error);
      return false;
    }
  }
  return service.remove(id);
}

export async function toggleRewardStatus(id) {
  if (isApiEnabled("rewards")) {
    const actual = await getRewardById(id);
    if (!actual) return null;
    return updateReward(id, { status: actual.status === "Activo" ? "Inactivo" : "Activo" });
  }
  return service.toggleStatus(id, ["Activo", "Inactivo"]);
}

/**
 * Canjea una recompensa por puntos. Solo existe contra el backend: el canje
 * descuenta stock con triggers atómicos y resta puntos en el ledger; el
 * código QR resultante es el que se presenta físicamente en el aliado.
 * @param {string} rewardId
 * @returns {Promise<{ok: boolean, canje?: Object, error?: string}>}
 */
export async function redeemReward(rewardId) {
  if (!isApiEnabled("rewards")) {
    return { ok: false, error: "El canje estará disponible cuando el backend esté conectado." };
  }

  try {
    const canje = await apiPost(`/rewards/${rewardId}/redeem`);
    return {
      ok: true,
      canje: {
        id: canje.id,
        codigoQr: canje.codigo_qr,
        estado: canje.estado,
        expira: canje.fecha_expira,
        recompensa: canje.recompensa?.nombre ?? "",
      },
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión para canjear." };
    }
    // Los 409 de negocio (puntos insuficientes, sin stock) traen su mensaje.
    const detalle = typeof error.detail === "string" ? error.detail : null;
    return { ok: false, error: detalle ?? "No pudimos completar el canje. Inténtalo de nuevo." };
  }
}
