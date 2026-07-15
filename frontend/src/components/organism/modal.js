// Modal reutilizable para el panel de administración.
//
// Sustituye a prompt()/confirm() con formularios de verdad: varios campos,
// validación y cierre con Escape o clic en el fondo. Lo comparten las vistas
// de POIs, retos, recompensas y usuarios.

import "../../styles/organism/modal.css";

/**
 * Escapa texto para poder interpolarlo en HTML sin abrir un XSS.
 * @param {*} value - Valor a escapar.
 * @returns {string} Texto seguro.
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Construye el HTML de un campo del formulario.
 * @param {Object} field - Definición del campo.
 * @param {Object} values - Valores actuales.
 * @returns {string} HTML del campo.
 */
function renderField(field, values) {
  const value = values[field.name] ?? field.defaultValue ?? "";
  const required = field.required ? "required" : "";
  const id = `modal-field-${field.name}`;

  let control;

  if (field.type === "select") {
    const options = field.options
      .map(
        (option) =>
          `<option value="${escapeHtml(option)}" ${
            String(option) === String(value) ? "selected" : ""
          }>${escapeHtml(option)}</option>`
      )
      .join("");
    control = `<select id="${id}" name="${field.name}" ${required}>${options}</select>`;
  } else if (field.type === "textarea") {
    control = `<textarea id="${id}" name="${field.name}" rows="3" ${required}
      placeholder="${escapeHtml(field.placeholder ?? "")}">${escapeHtml(value)}</textarea>`;
  } else {
    const step = field.step ? `step="${field.step}"` : "";
    const min = field.min !== undefined ? `min="${field.min}"` : "";
    control = `<input id="${id}" type="${field.type ?? "text"}" name="${field.name}"
      value="${escapeHtml(value)}" ${step} ${min} ${required}
      placeholder="${escapeHtml(field.placeholder ?? "")}">`;
  }

  return `
    <div class="modal-field ${field.wide ? "modal-field--wide" : ""}">
      <label for="${id}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label>
      ${control}
      <span class="modal-field-error" data-error-for="${field.name}"></span>
    </div>
  `;
}

/**
 * Abre un modal con formulario y resuelve con los datos introducidos.
 * @param {Object} config - Configuración del modal.
 * @param {string} config.title - Título mostrado en la cabecera.
 * @param {Array<Object>} config.fields - Campos del formulario.
 * @param {Object} [config.values] - Valores iniciales (modo edición).
 * @param {string} [config.submitLabel] - Texto del botón de confirmación.
 * @returns {Promise<Object|null>} Datos del formulario, o null si se cancela.
 */
export function openFormModal({ title, fields, values = {}, submitLabel = "Guardar" }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="modal-header">
          <h2 class="modal-title">${escapeHtml(title)}</h2>
          <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
        </div>
        <form class="modal-form" novalidate>
          <div class="modal-fields">
            ${fields.map((field) => renderField(field, values)).join("")}
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-outline modal-cancel">Cancelar</button>
            <button type="submit" class="btn-primary">${escapeHtml(submitLabel)}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const form = overlay.querySelector(".modal-form");
    const close = (result) => {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(result);
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") close(null);
    };
    document.addEventListener("keydown", onKeydown);

    overlay.querySelector(".modal-close").addEventListener("click", () => close(null));
    overlay.querySelector(".modal-cancel").addEventListener("click", () => close(null));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(null);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(form).entries());
      const errors = validate(fields, data);

      overlay.querySelectorAll(".modal-field-error").forEach((el) => (el.textContent = ""));

      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([name, message]) => {
          const el = overlay.querySelector(`[data-error-for="${name}"]`);
          if (el) el.textContent = message;
        });
        return;
      }

      close(data);
    });

    // Foco en el primer campo para poder escribir sin tocar el ratón.
    overlay.querySelector("input, select, textarea")?.focus();
  });
}

/**
 * Valida los datos del formulario contra la definición de los campos.
 * @returns {Object} Mapa campo → mensaje de error. Vacío si todo es válido.
 */
function validate(fields, data) {
  const errors = {};

  fields.forEach((field) => {
    const raw = data[field.name];
    const value = typeof raw === "string" ? raw.trim() : raw;

    if (field.required && !value) {
      errors[field.name] = "Este campo es obligatorio.";
      return;
    }

    if (!value) return;

    if (field.type === "number") {
      const number = Number(value);
      if (Number.isNaN(number)) {
        errors[field.name] = "Debe ser un número.";
      } else if (field.min !== undefined && number < field.min) {
        errors[field.name] = `No puede ser menor que ${field.min}.`;
      } else if (field.max !== undefined && number > field.max) {
        errors[field.name] = `No puede ser mayor que ${field.max}.`;
      }
    }

    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = "Introduce un email válido.";
    }
  });

  return errors;
}

/**
 * Pide confirmación al usuario antes de una acción destructiva.
 * @param {Object} config - Configuración.
 * @param {string} config.title - Título del diálogo.
 * @param {string} config.message - Mensaje explicativo.
 * @param {string} [config.confirmLabel] - Texto del botón de confirmación.
 * @returns {Promise<boolean>} true si el usuario confirma.
 */
export function openConfirmModal({ title, message, confirmLabel = "Eliminar" }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box modal-box--sm" role="alertdialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">${escapeHtml(title)}</h2>
        </div>
        <p class="modal-message">${escapeHtml(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn-outline modal-cancel">Cancelar</button>
          <button type="button" class="btn-danger modal-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = (result) => {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(result);
    };

    const onKeydown = (event) => {
      if (event.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKeydown);

    overlay.querySelector(".modal-cancel").addEventListener("click", () => close(false));
    overlay.querySelector(".modal-confirm").addEventListener("click", () => close(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(false);
    });

    overlay.querySelector(".modal-confirm").focus();
  });
}
