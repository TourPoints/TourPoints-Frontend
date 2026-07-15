// Acceso a TourPoints.
//
// ⚠️ MODO DEMO: sin backend, la sesión se abre comprobando que el email exista
// entre los usuarios registrados. No se pide contraseña a propósito: validarla
// en el navegador no aportaría ninguna seguridad real. Ver auth.service.js.

import { login as signIn, getDemoAccounts } from "../../services/auth.service.js";
import { escapeHtml } from "../../components/organism/modal.js";
import { navigate } from "../../router/router.js";
import "../../styles/pages/auth.css";

export function login() {
  const { admin, user } = getDemoAccounts();

  return `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-head">
          <h1 class="auth-title">Bienvenido de vuelta</h1>
          <p class="auth-sub">Entra para guardar tus lugares favoritos y sumar puntos.</p>
        </div>

        <form class="auth-form" id="login-form" novalidate>
          <div class="auth-field">
            <label for="login-email">Email</label>
            <input
              type="email"
              id="login-email"
              name="email"
              placeholder="tucorreo@email.com"
              autocomplete="email"
              required
            >
            <span class="auth-error" id="login-error"></span>
          </div>

          <button type="submit" class="auth-submit">Entrar</button>
        </form>

        <div class="auth-demo">
          <span class="auth-demo-title">Modo demo · sin contraseña</span>
          <p class="auth-demo-text">
            Todavía no hay servidor, así que basta con un email registrado.
            Prueba con estas cuentas:
          </p>
          <div class="auth-demo-accounts">
            ${
              admin
                ? `<button type="button" class="auth-demo-chip" data-email="${escapeHtml(admin.email)}">
                     <span class="auth-demo-role">Administrador</span>
                     <span class="auth-demo-email">${escapeHtml(admin.email)}</span>
                   </button>`
                : ""
            }
            ${
              user
                ? `<button type="button" class="auth-demo-chip" data-email="${escapeHtml(user.email)}">
                     <span class="auth-demo-role">Usuario</span>
                     <span class="auth-demo-email">${escapeHtml(user.email)}</span>
                   </button>`
                : ""
            }
          </div>
        </div>

        <p class="auth-alt">
          ¿No tienes cuenta? <a href="/register" data-link>Crear una</a>
        </p>
      </div>
    </section>
  `;
}

export function initLogin() {
  const form = document.getElementById("login-form");
  const input = document.getElementById("login-email");
  const error = document.getElementById("login-error");
  if (!form || !input) return;

  // Los chips rellenan el email para poder entrar de un clic.
  document.querySelectorAll(".auth-demo-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.email;
      error.textContent = "";
      input.focus();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";

    const email = input.value.trim();
    if (!email) {
      error.textContent = "Escribe tu email para continuar.";
      return;
    }

    const result = await signIn(email);
    if (!result.ok) {
      error.textContent = result.error;
      return;
    }

    // Los administradores entran directos a su panel; el resto, al inicio.
    navigate(result.user.role === "admin" ? "/admin" : "/");
  });
}
