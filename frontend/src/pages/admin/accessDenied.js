// Bloque de acceso denegado compartido por todas las vistas del panel admin.
//
// Nota: este guard es solo de interfaz. El rol vive en localStorage, así que
// cualquiera puede fijarlo desde la consola. La autorización real tiene que
// aplicarla el backend en cada endpoint.

/**
 * @returns {string} HTML del aviso de acceso denegado.
 */
export function accessDenied() {
  return `
    <div class="access-denied">
      <i class="access-denied-icon" data-lucide="shield-alert" aria-hidden="true"></i>
      <p>Acceso denegado. Solo administradores.</p>
      <a href="/" class="btn-primary access-denied-link" data-link>Volver al inicio</a>
    </div>
  `;
}
