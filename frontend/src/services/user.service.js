import { mockUsers } from "../mocks/users.js";
import { createCrudService } from "./createCrudService.js";

// Servicio de Usuarios (panel admin).
//
// ── ENDPOINTS esperados (backend) ────────────────────────────
//   GET    /admin/users            → lista
//   GET    /admin/users/:id        → detalle
//   PUT    /admin/users/:id        → editar (nombre, email, rol)
//   PATCH  /admin/users/:id/status → activar / suspender
//   DELETE /admin/users/:id        → eliminar
// ─────────────────────────────────────────────────────────────
//
// Nota: createUser lo usa el registro público, no el panel. El panel no da de
// alta usuarios a mano; las cuentas nacen del formulario de registro.

const service = createCrudService({
  collection: "users",
  seed: mockUsers,
  idPrefix: "USR",
  apiPath: "/admin/users",
  defaults: { role: "user", status: "Activo", points: 0 },
  numericFields: ["points"],
});

export const getUsers = () => service.list();
export const getUserById = (id) => service.getById(id);
export const createUser = (data) => service.create(data);
export const updateUser = (id, changes) => service.update(id, changes);
export const deleteUser = (id) => service.remove(id);
export const toggleUserStatus = (id) => service.toggleStatus(id, ["Activo", "Suspendido"]);
