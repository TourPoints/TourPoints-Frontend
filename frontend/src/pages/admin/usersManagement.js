// src/pages/admin/usersManagement.js
// Gestión de Usuarios (Admin)
//
// No hay alta de usuarios desde el panel: las cuentas se crean por el registro
// y requieren credenciales, que son responsabilidad del backend. Aquí solo se
// consultan, editan, suspenden o eliminan.

import { getUsers, updateUser, deleteUser } from "../../services/user.service.js";
import { USER_ROLES, USER_STATUSES } from "../../mocks/users.js";
import { createAdminCrudView, statusSelect, titleCell } from "./createAdminCrudView.js";
import { escapeHtml } from "../../components/organism/modal.js";
import { formatDate } from "../../utils/date.js";

function roleBadge(role) {
  return role === "admin"
    ? `<span class="badge badge-admin">Admin</span>`
    : `<span class="badge badge-user">Usuario</span>`;
}

const { view, init } = createAdminCrudView({
  title: "Gestión de Usuarios",
  entityLabel: "Usuario",
  tableId: "user",
  canCreate: false,
  searchFields: ["name", "email", "role", "status"],

  service: {
    list: getUsers,
    update: updateUser,
    remove: deleteUser,
  },

  columns: [
    {
      header: "Usuario",
      render: (u) =>
        titleCell({
          thumb: `<span class="user-avatar-thumb">${escapeHtml(u.name.charAt(0))}</span>`,
          title: u.name,
          subtitle: u.email,
        }),
    },
    { header: "Rol", render: (u) => roleBadge(u.role) },
    { header: "Estado", render: (u) => statusSelect(u.status, USER_STATUSES) },
    {
      header: "Puntos",
      render: (u) => `<span class="points-val">${(Number(u.points) || 0).toLocaleString("es-ES")} pts</span>`,
    },
    { header: "Alta", render: (u) => `<span class="cell-muted">${formatDate(u.joined)}</span>` },
  ],

  fields: () => [
    { name: "name", label: "Nombre completo", required: true, wide: true },
    { name: "email", label: "Email", type: "email", required: true, wide: true },
    { name: "role", label: "Rol", type: "select", options: USER_ROLES, required: true },
    { name: "status", label: "Estado", type: "select", options: USER_STATUSES, required: true },
    { name: "points", label: "Puntos acumulados", type: "number", min: 0, required: true },
  ],

  stats: (items) => {
    const active = items.filter((u) => u.status === "Activo").length;
    const admins = items.filter((u) => u.role === "admin").length;
    const totalPoints = items.reduce((sum, u) => sum + (Number(u.points) || 0), 0);
    return [
      { icon: "users-round", label: "Total Usuarios", value: items.length, badge: "Registrados", cls: "info" },
      { icon: "circle-check", label: "Activos", value: active, badge: "Sin restricción", cls: "up" },
      { icon: "shield-check", label: "Administradores", value: admins, badge: "Con panel", cls: "new" },
      {
        icon: "star",
        label: "Puntos acumulados",
        value: totalPoints.toLocaleString("es-ES"),
        badge: "Total",
        cls: "info",
      },
    ];
  },
});

export const usersManagement = view;
export const initUsersManagement = init;
