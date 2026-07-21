import { mockUsers } from "../mocks/users.js";
import { createCrudService } from "./createCrudService.js";
import { adaptUsuario } from "./auth.service.js";
import { apiGet, apiGetItems, apiPost, apiPatch, apiDelete, isApiEnabled, ApiError } from "./api.client.js";

// Servicio de Usuarios (panel admin). Cableado al backend real (docs/CABLEADO.md).
//
// Contra la API, todo exige token de administrador:
//   GET    /users                  → lista (paginada)
//   GET    /users/{id}             → detalle
//   POST   /users                  → alta administrativa
//   PATCH  /users/{id}             → editar (nombre, email, rol, teléfono)
//   POST   /users/{id}/activate    → reactivar
//   POST   /users/{id}/suspend     → suspender
//   DELETE /users/{id}             → baja (soft delete)
//
// El adaptador es el mismo del login (adaptUsuario): nombre+apellido → name,
// rol_id → role, estado → status. Los puntos no viven en el usuario sino en
// el ledger, así que la columna del panel muestra 0 hasta que exista un
// saldo por usuario consultable por admin (anotado en la bitácora).
//
// Nota: createUser lo usa también el registro público en modo local.

const ADMIN_ROL_ID = 1;

const service = createCrudService({
  collection: "users",
  seed: mockUsers,
  idPrefix: "USR",
  apiPath: "/admin/users",
  defaults: { role: "user", status: "Activo", points: 0 },
  numericFields: ["points"],
});

/** Campos del formulario del panel → UsuarioUpdate del backend. */
function toBackendUser(data) {
  const body = {};
  if (data.name !== undefined) {
    const parts = String(data.name).trim().split(/\s+/);
    body.nombre = parts[0];
    body.apellido = parts.slice(1).join(" ") || parts[0];
  }
  if (data.email !== undefined) body.email = data.email;
  if (data.role !== undefined) body.rol_id = data.role === "admin" ? ADMIN_ROL_ID : 2;
  if (data.telefono !== undefined) body.telefono = data.telefono;
  return body;
}

export async function getUsers() {
  if (isApiEnabled("users")) {
    const items = await apiGetItems("/users");
    return items.map(adaptUsuario);
  }
  return service.list();
}

export async function getUserById(id) {
  if (isApiEnabled("users")) {
    try {
      return adaptUsuario(await apiGet(`/users/${id}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
  return service.getById(id);
}

export async function createUser(data) {
  if (isApiEnabled("users")) {
    const creado = await apiPost("/users", {
      ...toBackendUser(data),
      email: data.email,
      // El alta administrativa exige contraseña; si el formulario no la trae,
      // se genera una aleatoria que el usuario deberá restablecer.
      password: data.password ?? crypto.randomUUID(),
    });
    return adaptUsuario(creado);
  }
  return service.create(data);
}

async function setUserStatus(id, status) {
  if (status === "Activo") return apiPost(`/users/${id}/activate`);
  return apiPost(`/users/${id}/suspend`);
}

export async function updateUser(id, changes) {
  if (isApiEnabled("users")) {
    try {
      const body = toBackendUser(changes);
      const actualizado = Object.keys(body).length
        ? await apiPatch(`/users/${id}`, body)
        : null;
      // El estado va por sus endpoints dedicados, no por el PATCH.
      if (changes.status !== undefined) {
        await setUserStatus(id, changes.status);
        return getUserById(id);
      }
      return actualizado ? adaptUsuario(actualizado) : getUserById(id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }
  return service.update(id, changes);
}

export async function deleteUser(id) {
  if (isApiEnabled("users")) {
    try {
      await apiDelete(`/users/${id}`);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return false;
      throw error;
    }
  }
  return service.remove(id);
}

export async function toggleUserStatus(id) {
  if (isApiEnabled("users")) {
    const actual = await getUserById(id);
    if (!actual) return null;
    const siguiente = actual.status === "Activo" ? "Suspendido" : "Activo";
    await setUserStatus(id, siguiente);
    return { ...actual, status: siguiente };
  }
  return service.toggleStatus(id, ["Activo", "Suspendido"]);
}
