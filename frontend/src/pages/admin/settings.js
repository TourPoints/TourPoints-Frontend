// src/pages/admin/settings.js
// Configuración del Panel de Administración (Admin)
// Estructura base; el backend conectará esto con servicios de configuración del sistema.

import { isAdmin } from "../../utils/role.js";
import { accessDenied } from "./accessDenied.js";

export function adminSettings() {
  if (!isAdmin()) return accessDenied();

  return `
    <div class="admin-page-header">
      <h1 class="admin-page-title">Configuración del Sistema</h1>
    </div>

    <div class="admin-section" style="max-width: 600px; margin-bottom: 2rem;">
      <h2 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <i data-lucide="sliders-horizontal" aria-hidden="true" style="width: 1.1rem; height: 1.1rem; color: var(--color-principal);"></i>
        Parámetros de Gamificación
      </h2>
      <form id="settings-gamification-form" onsubmit="event.preventDefault(); alert('Configuración guardada (Mock)');" style="display: flex; flex-direction: column; gap: 1.25rem;">
        
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Multiplicador de Puntos (General)</label>
          <input type="number" step="0.1" value="1.0" style="padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;" required />
          <span style="font-size: 0.75rem; color: #94a3b8;">Multiplica los puntos base otorgados por visitar POIs o completar retos.</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: #475569;">Distancia máxima de validación (metros)</label>
          <input type="number" value="50" style="padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;" required />
          <span style="font-size: 0.75rem; color: #94a3b8;">Radio en el cual un usuario debe estar ubicado para validar que visitó un POI usando GPS.</span>
        </div>

        <div style="display: flex; gap: 1rem; align-items: center;">
          <input type="checkbox" id="allow-manual-checkin" checked style="width: 16px; height: 16px;" />
          <label for="allow-manual-checkin" style="font-size: 0.85rem; font-weight: 600; color: #475569;">Permitir check-in manual sin GPS</label>
        </div>

        <button type="submit" class="btn-primary" style="align-self: flex-start; margin-top: 0.5rem;">Guardar Parámetros</button>
      </form>
    </div>

    <div class="admin-section" style="max-width: 600px;">
      <h2 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 1.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <i data-lucide="shield-check" aria-hidden="true" style="width: 1.1rem; height: 1.1rem; color: var(--color-principal);"></i>
        Seguridad y Roles
      </h2>
      <div style="font-size: 0.85rem; color: #475569; display: flex; flex-direction: column; gap: 1rem;">
        <p>El backend configurará aquí la gestión de permisos por rol (RBAC), tokens de expiración de sesión y políticas de contraseñas.</p>
        <div style="padding: 0.75rem; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
          <strong>Nota de Desarrollo:</strong> Las rutas de frontend están estructuradas y protegidas dinámicamente con guards que verifican <code>localStorage.getItem('role')</code>. Una vez implementado JWT, deberá cambiarse para decodificar el token de sesión.
        </div>
      </div>
    </div>
  `;
}
