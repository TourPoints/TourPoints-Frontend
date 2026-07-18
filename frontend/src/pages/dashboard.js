// Dashboard del usuario (wireframe "Dashboard Usuario Mid-Fidelity").
//
// Resumen personal: puntos, retos en curso, recompensas al alcance y la
// actividad reciente. Todo sale de los servicios que ya existen — no inventa
// datos: por eso la tercera métrica es "Lugares favoritos" y no "Recompensas
// reclamadas" como decía el wireframe, porque aún no hay sistema de canjes
// (ver docs/INTEGRACION_BACKEND.md); cuando el backend traiga /canjes, esa
// tarjeta y el historial ganan los eventos de canje.
//
// El historial se compone en el cliente cruzando el progreso de retos y los
// favoritos, que son los eventos con fecha que hoy se registran. El backend
// lo sustituirá por un endpoint de actividad.

import { getCurrentUser, updateSessionUser, updateMyProfile, logout } from "../services/auth.service.js";
import { getUsers, updateUser } from "../services/user.service.js";
import { getChallenges } from "../services/challenge.service.js";
import { PROGRESS, getMyProgress, getMyProgressEntries, refreshMyChallengeProgress } from "../services/challengeProgress.service.js";
import { getRewards } from "../services/reward.service.js";
import { getMyFavoriteEntries } from "../services/favorite.service.js";
import { getPois } from "../services/poi.service.js";
import { challengeCard } from "../components/molecules/challengeCard.js";
import { openFormModal, openConfirmModal, escapeHtml } from "../components/organism/modal.js";
import { navigate } from "../router/router.js";
import { formatRelativeDate } from "../utils/date.js";
import { refreshSessionPoints, getMyMovements } from "../services/points.service.js";
import { isApiEnabled } from "../services/api.client.js";
import { normalizeText } from "../utils/text.js";
import { loadIcons } from "../utils/icons.js";
import "/src/styles/pages/dashboard.css";

/** Número con separador de miles en es-ES. */
const formatPoints = (value) => (Number(value) || 0).toLocaleString("es-ES");

/** Nombre de pila para el saludo. */
const firstName = (name) => String(name || "").trim().split(/\s+/)[0] || "viajero";

/** "Alejandro G." para el chip de perfil, como en el wireframe. */
function shortName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function dashboard() {
  const user = getCurrentUser();

  // Mismo patrón que favoritos: sin sesión la página lo dice, no redirige a
  // ciegas. El router no puede ayudar aquí — su flag `auth` exige admin.
  if (!user) {
    return `
      <section class="dashboard-page">
        <div class="dashboard-locked">
          <i class="dashboard-locked-icon" data-lucide="lock" aria-hidden="true"></i>
          <p>Inicia sesión para ver tu panel de viajero.</p>
          <a href="/login" class="btn btn--primary" data-link>Iniciar sesión</a>
        </div>
      </section>
    `;
  }

  return `
    <section class="dashboard-page">

      <header class="dashboard-header">
        <div class="dashboard-greeting">
          <h1>Hola, <span id="dashboard-first-name">${escapeHtml(firstName(user.name))}</span></h1>
          <p>¡Tu próxima aventura está a solo unos pasos!</p>
        </div>

        <div class="dashboard-header-actions">
          <span class="dashboard-user-chip" id="dashboard-user-chip">
            <span class="dashboard-user-avatar" aria-hidden="true">${escapeHtml(initials(user.name))}</span>
            <span id="dashboard-short-name">${escapeHtml(shortName(user.name))}</span>
          </span>
          <button type="button" class="btn-outline dashboard-edit-btn" id="dashboard-edit-profile">
            <i data-lucide="square-pen" aria-hidden="true"></i>
            <span>Editar perfil</span>
          </button>
          <button type="button" class="btn-primary dashboard-logout-btn" id="dashboard-logout">
            <i data-lucide="log-out" aria-hidden="true"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      <div class="dashboard-stats">
        <div class="dashboard-stat dashboard-stat--points">
          <span class="dashboard-stat-coin" aria-hidden="true">P</span>
          <div>
            <span class="dashboard-stat-label">Puntos totales</span>
            <span class="dashboard-stat-value" id="dashboard-points">${formatPoints(user.points)} pts</span>
          </div>
        </div>
        <div class="dashboard-stat">
          <div>
            <span class="dashboard-stat-label">Retos completados</span>
            <span class="dashboard-stat-value" id="dashboard-completed">—</span>
          </div>
        </div>
        <div class="dashboard-stat">
          <div>
            <span class="dashboard-stat-label">Lugares favoritos</span>
            <span class="dashboard-stat-value" id="dashboard-favorites">—</span>
          </div>
        </div>
      </div>

      <div class="dashboard-columns">

        <div class="dashboard-main">
          <section class="dashboard-section">
            <div class="dashboard-section-head">
              <h2>Retos activos</h2>
              <a href="/challenges" class="link" data-link>Ver todos</a>
            </div>
            <div class="dashboard-challenges" id="dashboard-challenges">
              <p class="dashboard-loading">Cargando retos...</p>
            </div>
          </section>

          <section class="dashboard-section">
            <div class="dashboard-section-head">
              <h2>Recompensas disponibles</h2>
              <a href="/rewards" class="link" data-link>Ver recompensas</a>
            </div>
            <div class="dashboard-rewards" id="dashboard-rewards"></div>
          </section>
        </div>

        <aside class="dashboard-side">
          <section class="dashboard-section dashboard-history">
            <div class="dashboard-section-head">
              <h2>Historial reciente</h2>
              <i data-lucide="clock" aria-hidden="true"></i>
            </div>
            <ul class="dashboard-events" id="dashboard-events"></ul>
          </section>

          <div class="dashboard-cta">
            <h3>¿Buscas inspiración?</h3>
            <p>Descubre los rincones que hacen única a Barranquilla.</p>
            <a href="/explore" class="dashboard-cta-btn" data-link>Explorar ahora</a>
          </div>
        </aside>

      </div>
    </section>
  `;
}

export async function initDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  bindHeaderActions();

  let challenges = [];
  let rewards = [];
  let pois = [];
  try {
    [challenges, rewards, pois] = await Promise.all([getChallenges(), getRewards(), getPois()]);
  } catch (error) {
    console.error("Error al cargar los datos del dashboard:", error);
  }

  // El saldo vive en el ledger del backend; user.points es solo caché.
  const saldo = await refreshSessionPoints().catch(() => Number(user.points) || 0);
  const pointsEl = document.getElementById("dashboard-points");
  if (pointsEl) pointsEl.textContent = `${saldo.toLocaleString("es-ES")} pts`;

  await refreshMyChallengeProgress().catch(() => {});
  const progressEntries = getMyProgressEntries();
  const favoriteEntries = await getMyFavoriteEntries();

  renderStats(progressEntries, favoriteEntries);
  renderActiveChallenges(challenges);
  renderRewards(rewards, { ...user, points: saldo });

  // Con backend, el historial es el ledger real (visitas, retos, canjes);
  // sin él, se compone de los eventos locales como hasta ahora.
  if (isApiEnabled("points")) {
    renderHistoryFromMovements(await getMyMovements().catch(() => []));
  } else {
    renderHistory(progressEntries, favoriteEntries, challenges, pois);
  }

  loadIcons();
}

// ── Cabecera ──────────────────────────────────────────────────

function bindHeaderActions() {
  document.getElementById("dashboard-edit-profile")?.addEventListener("click", handleEditProfile);

  document.getElementById("dashboard-logout")?.addEventListener("click", async () => {
    const confirmed = await openConfirmModal({
      title: "Cerrar sesión",
      message: "¿Seguro que quieres salir de tu cuenta?",
      confirmLabel: "Cerrar sesión",
    });
    if (!confirmed) return;

    logout();
    navigate("/");
  });
}

/**
 * Edición mínima de perfil: nombre y email, con el email validado contra las
 * cuentas existentes para no duplicarlo. El alta de campos más ricos
 * (teléfono, foto) llegará con PATCH /usuarios/me del backend.
 */
async function handleEditProfile() {
  const user = getCurrentUser();
  if (!user) return;

  const data = await openFormModal({
    title: "Editar perfil",
    submitLabel: "Guardar cambios",
    values: { name: user.name, email: user.email },
    fields: [
      { name: "name", label: "Nombre completo", required: true, wide: true },
      { name: "email", label: "Email", type: "email", required: true, wide: true },
    ],
  });
  if (!data) return;

  let updated;
  if (isApiEnabled("auth")) {
    // Contra el backend el perfil propio va por PATCH /users/me (el CRUD de
    // /users exige rol admin) y la unicidad del email la valida el servidor.
    const result = await updateMyProfile({ name: data.name, email: data.email });
    if (!result.ok) {
      await openConfirmModal({ title: "No se pudo guardar", message: result.error, confirmLabel: "Entendido" });
      return handleEditProfile();
    }
    updated = result.user;
  } else {
    const users = await getUsers();
    const target = normalizeText(data.email);
    const taken = users.some(
      (item) => item.id !== user.id && normalizeText(item.email) === target
    );
    if (taken) {
      // El modal ya se cerró: se reabre con el aviso en vez de perder lo escrito.
      await openConfirmModal({
        title: "Email en uso",
        message: "Ya existe otra cuenta con ese email. Elige uno distinto.",
        confirmLabel: "Entendido",
      });
      return handleEditProfile();
    }

    await updateUser(user.id, { name: data.name, email: data.email });
    updated = updateSessionUser({ name: data.name, email: data.email });
  }

  // Refrescar saludo y chip sin repintar la página entera.
  const nameEl = document.getElementById("dashboard-first-name");
  const shortEl = document.getElementById("dashboard-short-name");
  const chip = document.querySelector("#dashboard-user-chip .dashboard-user-avatar");
  if (nameEl) nameEl.textContent = firstName(updated.name);
  if (shortEl) shortEl.textContent = shortName(updated.name);
  if (chip) chip.textContent = initials(updated.name);
}

// ── Métricas ──────────────────────────────────────────────────

function renderStats(progressEntries, favoriteEntries) {
  const completed = progressEntries.filter((e) => e.state === PROGRESS.COMPLETED).length;

  const completedEl = document.getElementById("dashboard-completed");
  const favoritesEl = document.getElementById("dashboard-favorites");
  if (completedEl) completedEl.textContent = String(completed);
  if (favoritesEl) favoritesEl.textContent = String(favoriteEntries.length);
}

// ── Retos activos ─────────────────────────────────────────────

function renderActiveChallenges(challenges) {
  const container = document.getElementById("dashboard-challenges");
  if (!container) return;

  const progress = getMyProgress();
  const active = challenges.filter(
    (c) => c.status === "Activo" && progress.get(c.id) === PROGRESS.IN_PROGRESS
  );

  if (active.length === 0) {
    container.innerHTML = `
      <div class="dashboard-empty">
        <p>No tienes retos en curso.</p>
        <a href="/challenges" class="btn btn--primary" data-link>Buscar un reto</a>
      </div>
    `;
    return;
  }

  container.innerHTML = active
    .slice(0, 2)
    .map((c) => challengeCard({ ...c, state: PROGRESS.IN_PROGRESS }))
    .join("");

  // La tarjeta trae un botón pensado para el modal de la página de retos;
  // aquí el detalle vive allí, así que el botón lleva a esa página.
  container.querySelectorAll("[data-challenge-id]").forEach((btn) => {
    btn.addEventListener("click", () => navigate("/challenges"));
  });
}

// ── Recompensas ───────────────────────────────────────────────

function renderRewards(rewards, user) {
  const container = document.getElementById("dashboard-rewards");
  if (!container) return;

  const available = rewards.filter((r) => r.status === "Activo").slice(0, 4);

  if (available.length === 0) {
    container.innerHTML = `<p class="dashboard-empty-hint">No hay recompensas activas por ahora.</p>`;
    return;
  }

  const points = Number(user.points) || 0;

  container.innerHTML = available
    .map((reward) => {
      const cost = Number(reward.pointsCost) || 0;
      const affordable = points >= cost;
      return `
        <a
          href="/rewards"
          data-link
          class="dash-reward ${affordable ? "" : "dash-reward--far"}"
          title="${affordable ? "" : `Te faltan ${formatPoints(cost - points)} pts`}"
        >
          <span class="dash-reward-emoji" aria-hidden="true">${escapeHtml(reward.emoji ?? "🎁")}</span>
          <span class="dash-reward-name">${escapeHtml(reward.name)}</span>
          <span class="dash-reward-cost">${formatPoints(cost)} pts</span>
        </a>
      `;
    })
    .join("");
}

// ── Historial ─────────────────────────────────────────────────

/**
 * Cruza los eventos con fecha que existen hoy (progreso de retos y favoritos)
 * en una sola línea de tiempo. Cada evento: icono, texto, cuándo y ±puntos.
 */
function buildEvents(progressEntries, favoriteEntries, challenges, pois) {
  const challengeById = new Map(challenges.map((c) => [c.id, c]));
  const poiById = new Map(pois.map((p) => [String(p.id), p]));

  const fromProgress = progressEntries.map((entry) => {
    const challenge = challengeById.get(entry.challengeId);
    const name = challenge?.name ?? "un reto";
    const completed = entry.state === PROGRESS.COMPLETED;
    return {
      when: entry.updatedAt,
      icon: completed ? "trophy" : "target",
      text: completed ? `Completaste «${name}»` : `Comenzaste «${name}»`,
      points: completed ? Number(challenge?.points) || 0 : 0,
    };
  });

  const fromFavorites = favoriteEntries.map((entry) => {
    const poi = poiById.get(String(entry.poiId));
    return {
      when: entry.createdAt,
      icon: "heart",
      text: `Guardaste «${poi?.name ?? "un lugar"}» en favoritos`,
      points: 0,
    };
  });

  return [...fromProgress, ...fromFavorites]
    .filter((event) => event.when)
    .sort((a, b) => new Date(b.when) - new Date(a.when))
    .slice(0, 6);
}

// Cómo se cuenta cada tipo de movimiento del ledger en la línea de tiempo.
const MOVEMENT_LABELS = {
  VISITA: { icon: "map-pin-check", text: "Check-in validado" },
  RETO: { icon: "trophy", text: "Reto completado" },
  CANJE: { icon: "ticket", text: "Canje de recompensa" },
  COMPRA: { icon: "package", text: "Compra en aliado" },
};

/** Pinta el historial desde los movimientos reales del ledger del backend. */
function renderHistoryFromMovements(movements) {
  const container = document.getElementById("dashboard-events");
  if (!container) return;

  if (movements.length === 0) {
    container.innerHTML = `
      <li class="dashboard-empty-hint">
        Aquí aparecerá tu actividad: visitas, retos y canjes.
      </li>
    `;
    return;
  }

  container.innerHTML = movements
    .slice(0, 6)
    .map((mov) => {
      const meta = MOVEMENT_LABELS[mov.tipo_movimiento] ?? { icon: "star", text: "Movimiento de puntos" };
      const pts = Number(mov.puntos) || 0;
      return `
      <li class="dash-event">
        <span class="dash-event-icon dash-event-icon--${meta.icon === "trophy" ? "trophy" : meta.icon === "heart" ? "heart" : "target"}" aria-hidden="true">
          <i data-lucide="${meta.icon}"></i>
        </span>
        <div class="dash-event-body">
          <p>${escapeHtml(meta.text)}</p>
          <span>${escapeHtml(formatRelativeDate(mov.created_at))}</span>
        </div>
        <span class="dash-event-points${pts < 0 ? " dash-event-points--negative" : ""}">${pts >= 0 ? "+" : "−"}${formatPoints(Math.abs(pts))} pts</span>
      </li>
    `;
    })
    .join("");
}

function renderHistory(progressEntries, favoriteEntries, challenges, pois) {
  const container = document.getElementById("dashboard-events");
  if (!container) return;

  const events = buildEvents(progressEntries, favoriteEntries, challenges, pois);

  if (events.length === 0) {
    container.innerHTML = `
      <li class="dashboard-empty-hint">
        Aquí aparecerá tu actividad: retos, favoritos y visitas.
      </li>
    `;
    return;
  }

  container.innerHTML = events
    .map(
      (event) => `
      <li class="dash-event">
        <span class="dash-event-icon dash-event-icon--${event.icon}" aria-hidden="true">
          <i data-lucide="${event.icon}"></i>
        </span>
        <div class="dash-event-body">
          <p>${escapeHtml(event.text)}</p>
          <span>${escapeHtml(formatRelativeDate(event.when))}</span>
        </div>
        ${event.points ? `<span class="dash-event-points">+${formatPoints(event.points)} pts</span>` : ""}
      </li>
    `
    )
    .join("");
}
