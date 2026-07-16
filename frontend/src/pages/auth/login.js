// Acceso a TourPoints.
//
// Dos modos, según haya backend cableado o no (docs/CABLEADO.md):
// - API real: email + contraseña contra POST /auth/login.
// - MODO DEMO: basta un email registrado; no se pide contraseña a propósito,
//   validarla en el navegador no aportaría seguridad real. Ver auth.service.js.

import { login as signIn, getDemoAccounts } from "../../services/auth.service.js";
import { isApiEnabled } from "../../services/api.client.js";
import { escapeHtml } from "../../components/organism/modal.js";
import { navigate } from "../../router/router.js";
import "../../styles/pages/auth.css";

export function login() {
  const apiMode = isApiEnabled("auth");
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
          </div>

          ${
            apiMode
              ? `
          <div class="auth-field">
            <label for="login-password">Contraseña</label>
            <input
              type="password"
              id="login-password"
              name="password"
              placeholder="Tu contraseña"
              autocomplete="current-password"
              required
            >
          </div>
          `
              : ""
          }

          <span class="auth-error" id="login-error"></span>
          <button type="submit" class="auth-submit">Entrar</button>
        </form>

        ${
          apiMode
            ? ""
            : `
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
        `
        }

        <p class="auth-alt">
          ¿No tienes cuenta? <a href="/register" data-link>Crear una</a>
        </p>
      </div>
    </section>
  `;
}

export function initLogin() {
  const apiMode = isApiEnabled("auth");
  const form = document.getElementById("login-form");
  const input = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const error = document.getElementById("login-error");
  if (!form || !input) return;

  // Los chips rellenan el email para poder entrar de un clic (solo demo).
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
    const password = passwordInput?.value ?? "";

    if (!email) {
      error.textContent = "Escribe tu email para continuar.";
      return;
    }
    if (apiMode && !password) {
      error.textContent = "Escribe tu contraseña para continuar.";
      return;
    }

    const submit = form.querySelector(".auth-submit");
    submit.disabled = true;
    submit.textContent = "Entrando...";

    const result = await signIn(email, password);

    submit.disabled = false;
    submit.textContent = "Entrar";

    if (!result.ok) {
      error.textContent = result.error;
      return;
    }

    // Los administradores entran directos a su panel; el resto, al inicio.
    navigate(result.user.role === "admin" ? "/admin" : "/");
  });
}
