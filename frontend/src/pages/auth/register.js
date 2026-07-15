// Registro en TourPoints.
//
// ⚠️ MODO DEMO: sin backend, el alta solo crea el usuario en el almacenamiento
// local y abre sesión. No se piden contraseñas a propósito. Ver auth.service.js.

import { register as signUp } from "../../services/auth.service.js";
import { navigate } from "../../router/router.js";
import "../../styles/pages/auth.css";

export function register() {
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
              placeholder="Tu nombre"
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

          <button type="submit" class="auth-submit">Crear cuenta</button>
        </form>

        <div class="auth-demo">
          <span class="auth-demo-title">Modo demo · sin contraseña</span>
          <p class="auth-demo-text">
            Tu cuenta se guarda solo en este navegador y aparecerá en el panel
            de administración. Las cuentas nuevas se crean siempre como usuario.
          </p>
        </div>

        <p class="auth-alt">
          ¿Ya tienes cuenta? <a href="/login" data-link>Iniciar sesión</a>
        </p>
      </div>
    </section>
  `;
}

export function initRegister() {
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

    let valid = true;
    if (!name) {
      showError("name", "Dinos cómo te llamas.");
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email", "Introduce un email válido.");
      valid = false;
    }
    if (!valid) return;

    const result = await signUp({ name, email });
    if (!result.ok) {
      showError("email", result.error);
      return;
    }

    navigate("/");
  });
}
