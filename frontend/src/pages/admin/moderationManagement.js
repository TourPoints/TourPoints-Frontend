// src/pages/admin/moderationManagement.js
// Moderación de comentarios (Admin)
//
// El backend no ofrece un CRUD clásico para esto (no hay creación ni edición
// libre desde el panel, solo aprobar/rechazar), así que esta vista no usa
// createAdminCrudView.js — reutiliza sus mismas clases de tabla (incluida la
// que la convierte en tarjetas en móvil) para que se sienta parte del mismo
// panel, pero con su propio flujo, más simple.

import { getPendingComments, moderateComment } from "../../services/review.service.js";
import { openConfirmModal, escapeHtml } from "../../components/organism/modal.js";
import { accessDenied } from "./accessDenied.js";
import { isAdmin } from "../../utils/role.js";
import { formatRelativeDate } from "../../utils/date.js";
import { loadIcons } from "../../utils/icons.js";

let pendingComments = [];

export function moderationManagement() {
  if (!isAdmin()) return accessDenied();

  return `
    <div class="admin-page-header">
      <h1 class="admin-page-title">Moderación de comentarios</h1>
    </div>

    <div class="admin-table-section">
      <div class="admin-table-scroll">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Comentario</th>
              <th>Lugar</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="moderation-tbody">
            <tr><td colspan="4" class="admin-empty">Cargando...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export async function initModerationManagement() {
  if (!isAdmin()) return;
  await refresh();
}

async function refresh() {
  const tbody = document.getElementById("moderation-tbody");
  if (!tbody) return;

  try {
    pendingComments = await getPendingComments();
  } catch (error) {
    console.error("Error al cargar comentarios pendientes:", error);
    tbody.innerHTML = `<tr><td colspan="4" class="admin-empty">No se pudieron cargar los comentarios. Inténtalo de nuevo.</td></tr>`;
    return;
  }

  render();
}

function render() {
  const tbody = document.getElementById("moderation-tbody");
  if (!tbody) return;

  if (pendingComments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="admin-empty">No hay comentarios pendientes de revisión.</td></tr>`;
    return;
  }

  tbody.innerHTML = pendingComments
    .map(
      (c) => `
      <tr data-id="${escapeHtml(c.id)}">
        <td data-label="Comentario">
          <div class="moderation-comment">
            <span class="moderation-comment-author">${escapeHtml(c.author)}</span>
            <p class="moderation-comment-text">${escapeHtml(c.text)}</p>
          </div>
        </td>
        <td data-label="Lugar">${escapeHtml(c.poiName)}</td>
        <td data-label="Fecha"><span class="cell-muted">${formatRelativeDate(c.createdAt)}</span></td>
        <td data-label="Acciones">
          <div class="actions-cell">
            <button class="btn-icon" title="Aprobar" aria-label="Aprobar comentario" data-action="approve">
              <i data-lucide="check" aria-hidden="true"></i>
            </button>
            <button class="btn-icon del" title="Rechazar" aria-label="Rechazar comentario" data-action="reject">
              <i data-lucide="x" aria-hidden="true"></i>
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-action]").forEach((btn) => {
    const id = btn.closest("tr").dataset.id;
    btn.addEventListener("click", () => handleModerate(id, btn.dataset.action));
  });

  loadIcons();
}

async function handleModerate(id, action) {
  const isApprove = action === "approve";

  const confirmed = await openConfirmModal({
    title: isApprove ? "Aprobar comentario" : "Rechazar comentario",
    message: isApprove
      ? "El comentario se publicará y será visible para todos los usuarios."
      : "El comentario quedará rechazado y no se mostrará en el POI.",
    confirmLabel: isApprove ? "Aprobar" : "Rechazar",
  });
  if (!confirmed) return;

  const result = await moderateComment(id, isApprove ? "APROBADO" : "RECHAZADO");
  if (!result.ok) {
    await openConfirmModal({ title: "No se pudo actualizar", message: result.error, confirmLabel: "Entendido" });
    return;
  }

  await refresh();
}
