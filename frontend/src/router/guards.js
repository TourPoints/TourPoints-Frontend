// Guards de sesión/rol para el router.
//
// Antes este archivo comprobaba una clave "token" en localStorage que nunca
// se llega a escribir (la sesión real vive en services/auth.service.js bajo
// "tourpoints:session"), por lo que isAuthenticated() siempre devolvía false.
// Ahora delega en las fuentes de verdad reales para no duplicar lógica.

import { isAuthenticated as isSessionActive } from "../services/auth.service.js";
import { getRole } from "../utils/role.js";

export function isAuthenticated() {
  return isSessionActive();
}

export function getUserRole() {
  return getRole();
}
