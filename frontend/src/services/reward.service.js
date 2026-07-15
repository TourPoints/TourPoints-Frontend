import { mockRewards } from "../mocks/rewards.js";
import { createCrudService } from "./createCrudService.js";

// Servicio de Recompensas (US TOUR-39).
//
// ── ENDPOINTS esperados (backend) ────────────────────────────
//   GET    /admin/rewards          → lista
//   GET    /admin/rewards/:id      → detalle
//   POST   /admin/rewards          → crear
//   PUT    /admin/rewards/:id      → editar
//   DELETE /admin/rewards/:id      → eliminar
// ─────────────────────────────────────────────────────────────

export const REWARD_STATUSES = ["Activo", "Pendiente", "Inactivo"];

const service = createCrudService({
  collection: "rewards",
  seed: mockRewards,
  idPrefix: "REW",
  apiPath: "/admin/rewards",
  defaults: { status: "Pendiente", emoji: "🎁" },
  numericFields: ["pointsCost", "stock"],
});

export const getRewards = () => service.list();
export const getRewardById = (id) => service.getById(id);
export const createReward = (data) => service.create(data);
export const updateReward = (id, changes) => service.update(id, changes);
export const deleteReward = (id) => service.remove(id);
export const toggleRewardStatus = (id) => service.toggleStatus(id, ["Activo", "Inactivo"]);
