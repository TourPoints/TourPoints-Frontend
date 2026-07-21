// Datos semilla de Usuarios (panel admin).
// Los consume user.service.js; el backend los sustituirá por la API.
//
// Aquí no hay contraseñas a propósito: las credenciales nunca deben vivir
// en el frontend. La autenticación real la resolverá el backend.

export const mockUsers = [
  {
    id: "USR-001",
    name: "Carlos Mendoza",
    email: "carlos@email.com",
    role: "user",
    status: "Activo",
    points: 1250,
    joined: "2025-01-12",
  },
  {
    id: "USR-002",
    name: "Ana Torres",
    email: "ana@email.com",
    role: "user",
    status: "Activo",
    points: 870,
    joined: "2025-03-03",
  },
  {
    id: "USR-003",
    name: "Luis Ramírez",
    email: "luis@email.com",
    role: "admin",
    status: "Activo",
    points: 3400,
    joined: "2024-11-18",
  },
  {
    id: "USR-004",
    name: "María González",
    email: "maria@email.com",
    role: "user",
    status: "Suspendido",
    points: 320,
    joined: "2025-05-25",
  },
  {
    id: "USR-005",
    name: "Pedro Sánchez",
    email: "pedro@email.com",
    role: "user",
    status: "Activo",
    points: 590,
    joined: "2025-06-07",
  },
];

export const USER_ROLES = ["user", "admin"];
export const USER_STATUSES = ["Activo", "Suspendido"];
