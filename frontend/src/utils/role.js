// Rol del usuario en sesión, tal como lo consultan el router y las vistas.
//
// ⚠️ Es una comodidad de interfaz, no una garantía: cualquiera puede escribir
// esta clave desde la consola. La autorización real la aplicará el backend en
// cada endpoint.
//
// La clave lleva el prefijo del resto del almacenamiento por un motivo
// concreto: localStore borra todas las claves `tourpoints:*` cuando cambia
// SEED_VERSION. Sin prefijo, ese borrado se llevaba la sesión pero dejaba el
// rol vivo, y quedaba un estado imposible — sin sesión y con panel de
// administración accesible, el header ofreciendo "Iniciar sesión" mientras
// /admin seguía abriendo. Ahora sesión y rol caen juntos.
const ROLE_KEY = "tourpoints:role";

// Clave anterior, sin prefijo. Se limpia al cargar para que a nadie le quede
// un rol huérfano de antes de este cambio: sería un admin fantasma.
const LEGACY_ROLE_KEY = "role";
if (localStorage.getItem(LEGACY_ROLE_KEY) !== null) {
  localStorage.removeItem(LEGACY_ROLE_KEY);
}

export const setRole = (role) => localStorage.setItem(ROLE_KEY, role);
export const getRole = () => localStorage.getItem(ROLE_KEY);
export const isAdmin = () => getRole() === "admin";
export const clearRole = () => localStorage.removeItem(ROLE_KEY);
