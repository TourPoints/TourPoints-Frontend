import { mockChallenges } from "../mocks/challenges.js";
import { createCrudService } from "./createCrudService.js";

// Servicio de Desafíos (US TOUR-39).
//
// ── ENDPOINTS esperados (backend) ────────────────────────────
//   GET    /admin/challenges       → lista
//   GET    /admin/challenges/:id   → detalle
//   POST   /admin/challenges       → crear
//   PUT    /admin/challenges/:id   → editar
//   DELETE /admin/challenges/:id   → eliminar
// ─────────────────────────────────────────────────────────────

export const CHALLENGE_STATUSES = ["Activo", "Pendiente", "Inactivo"];

const service = createCrudService({
  collection: "challenges",
  seed: mockChallenges,
  idPrefix: "CHL",
  apiPath: "/admin/challenges",
  defaults: { status: "Pendiente" },
  numericFields: ["points"],
});

export const getChallenges = () => service.list();
export const getChallengeById = (id) => service.getById(id);
export const createChallenge = (data) => service.create(data);
export const updateChallenge = (id, changes) => service.update(id, changes);
export const deleteChallenge = (id) => service.remove(id);
export const toggleChallengeStatus = (id) => service.toggleStatus(id, ["Activo", "Inactivo"]);
