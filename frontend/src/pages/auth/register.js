// Registro en TourPoints.
//
// Dos modos, según haya backend cableado o no (docs/CABLEADO.md):
// - API real: nombre + email + contraseña contra POST /auth/register; el rol
//   lo asigna el servidor y la sesión se abre encadenando el login.
// - MODO DEMO: el alta solo crea el usuario en el almacenamiento local y abre
//   sesión, sin contraseña. Ver auth.service.js.

import { register as signUp } from "../../services/auth.service.js";
import { isApiEnabled } from "../../services/api.client.js";
import { navigate } from "../../router/router.js";
import "../../styles/pages/auth.css";

export function register() {
  const apiMode = isApiEnabled("auth");

  return `
    <section class="auth-page">
      <div class="auth-card">
        <div class="auth-head">
          <h1 class="auth-title">Crea tu cuenta</h1>
          <p class="auth-sub">Empieza a descubrir lugares y a ganar puntos por visitarlos.</p>
        </div>

        <form class="auth-form" id="register-form" novalidate>
          <div class="auth-field">
            <label for="register-name">Nombre completo</label>
            <input
              type="text"
              id="register-name"
              name="name"
              placeholder="Nombre y apellido"
              autocomplete="name"
              required
            >
            <span class="auth-error" data-error-for="name"></span>
          </div>

          <div class="auth-field">
            <label for="register-email">Email</label>
            <input
              type="email"
              id="register-email"
              name="email"
              placeholder="tucorreo@email.com"
              autocomplete="email"
              required
            >
            <span class="auth-error" data-error-for="email"></span>
          </div>

          ${
            apiMode
              ? `
          <div class="auth-field">
            <label for="register-password">Contraseña</label>
            <input
              type="password"
              id="register-password"
              name="password"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
              required
            >
            <span class="auth-error" data-error-for="password"></span>
          </div>
          `
              : ""
          }

          <span class="auth-error" id="register-error"></span>
          <button type="submit" class="auth-submit">Crear cuenta</button>
        </form>

        ${
          apiMode
            ? ""
            : `
        <div class="auth-demo">
          <span class="auth-demo-title">Modo demo · sin contraseña</span>
          <p class="auth-demo-text">
            Tu cuenta se guarda solo en este navegador y aparecerá en el panel
            de administración. Las cuentas nuevas se crean siempre como usuario.
          </p>
        </div>
        `
        }

        <p class="auth-alt">
          ¿Ya tienes cuenta? <a href="/login" data-link>Iniciar sesión</a>
        </p>
      </div>
    </section>
  `;
}

export function initRegister() {
  const apiMode = isApiEnabled("auth");
  const form = document.getElementById("register-form");
  if (!form) return;

  const showError = (field, message) => {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    form.querySelectorAll(".auth-error").forEach((el) => (el.textContent = ""));

    const name = form.querySelector("#register-name").value.trim();
    const email = form.querySelector("#register-email").value.trim();
    const password = form.querySelector("#register-password")?.value ?? "";

    let valid = true;
    if (!name) {
      showError("name", "Dinos cómo te llamas.");
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email", "Introduce un email válido.");
      valid = false;
    }
    if (apiMode && password.length < 8) {
      // El backend validará su propia política; este mínimo evita el viaje
      // para el caso obvio.
      showError("password", "La contraseña necesita al menos 8 caracteres.");
      valid = false;
    }
    if (!valid) return;

    const submit = form.querySelector(".auth-submit");
    submit.disabled = true;
    submit.textContent = "Creando cuenta...";

    const result = await signUp({ name, email, password });

    submit.disabled = false;
    submit.textContent = "Crear cuenta";

    if (!result.ok) {
      // El error del servidor puede ser de email (duplicado) o de contraseña
      // (política): va al aviso general en vez de clavarse en un campo.
      const general = document.getElementById("register-error");
      if (general) general.textContent = result.error;
      else showError("email", result.error);
      return;
    }

    navigate("/");
  });
}
