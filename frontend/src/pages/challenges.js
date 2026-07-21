// Página pública de Retos (US TOUR-35).
//
// Muestra los retos publicados por el admin y el progreso del usuario con
// sesión: disponibles, en curso y completados. Completar un reto acredita
// sus puntos a la cuenta y todo (métricas, pestañas, tarjetas) se actualiza
// en el sitio sin recargar la página.

import { getChallenges } from "../services/challenge.service.js";
import {
  PROGRESS,
  getMyProgress,
  setChallengeState,
  refreshMyChallengeProgress,
} from "../services/challengeProgress.service.js";
import { isApiEnabled } from "../services/api.client.js";
import { getCurrentUser, updateSessionUser } from "../services/auth.service.js";
import { refreshSessionPoints } from "../services/points.service.js";
import { updateUser } from "../services/user.service.js";
import { challengeCard } from "../components/molecules/challengeCard.js";
import { escapeHtml } from "../components/organism/modal.js";
import { normalizeText, includesNormalized, debounce } from "../utils/text.js";
import { formatDate } from "../utils/date.js";
import { loadIcons } from "../utils/icons.js";
import { t } from "../i18n/index.js";
import "/src/styles/pages/challenges.css";

// Pestañas de filtrado. "Todos" incluye cualquier estado de progreso.
// Función y no constante: las etiquetas deben resolverse en el idioma activo
// en cada render, no en el del arranque.
const TABS = () => [
  { id: "todos", label: t("challenges.tabAll") },
  { id: PROGRESS.IN_PROGRESS, label: t("challenges.tabInProgress") },
  { id: PROGRESS.COMPLETED, label: t("challenges.tabCompleted") },
];

let allChallenges = [];
let progress = new Map();
let currentTab = "todos";
let searchQuery = "";

export function challenges() {
  return `
    <section class="challenges-page">
      <div class="challenges-header">
        <div class="challenges-header-text">
          <h1>${t("challenges.title")}</h1>
          <p>${t("challenges.subtitle")}</p>
        </div>
        <div class="challenges-tabs" id="challenges-tabs" role="tablist"></div>
      </div>

      <!-- Buscador (visible en móvil, como en el diseño) -->
      <div class="challenges-search-wrapper">
        <i data-lucide="search" class="search-icon"></i>
        <input type="search" id="challenges-search" class="challenges-search"
               placeholder="${t("challenges.searchPlaceholder")}" autocomplete="off">
      </div>

      <!-- Progreso móvil -->
      <div class="challenges-progress-card">
        <div>
          <span class="progress-card-label">${t("challenges.yourProgress")}</span>
          <span class="progress-card-value" id="mobile-points">0 pts</span>
        </div>
        <span class="progress-card-trophy" aria-hidden="true">
          <i data-lucide="trophy"></i>
        </span>
      </div>

      <!-- Barra de métricas (desktop) -->
      <div class="challenges-stats" id="challenges-stats"></div>

      <div class="challenges-grid" id="challenges-grid">
        <p class="challenges-loading">${t("challenges.loading")}</p>
      </div>
    </section>
  `;
}

export async function initChallenges() {
  currentTab = "todos";
  searchQuery = "";

  try {
    const list = await getChallenges();
    // El público solo ve retos publicados; el estado de publicación es del admin.
    allChallenges = list.filter((challenge) => challenge.status === "Activo");
  } catch (error) {
    console.error("Error al cargar los retos:", error);
    showGridError();
    return;
  }

  await refreshSessionPoints().catch(() => {});
  await refreshMyChallengeProgress().catch(() => {});
  progress = getMyProgress();

  const search = document.getElementById("challenges-search");
  const runSearch = debounce(() => render(), 250);
  search?.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    runSearch();
  });

  render();
}

/** Estado de progreso de un reto para el usuario actual. */
function stateOf(challenge) {
  return progress.get(challenge.id) ?? PROGRESS.AVAILABLE;
}

/** Repinta pestañas, métricas y grid con el estado vigente. */
function render() {
  renderTabs();
  renderStats();
  renderGrid();
  loadIcons();
}

function renderTabs() {
  const container = document.getElementById("challenges-tabs");
  if (!container) return;

  container.innerHTML = TABS().map(
    (tab) => `
      <button type="button" role="tab" data-tab="${tab.id}"
              class="challenges-tab ${tab.id === currentTab ? "active" : ""}"
              aria-selected="${tab.id === currentTab}">
        ${tab.label}
      </button>
    `
  ).join("");

  container.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      render();
    });
  });
}

function renderStats() {
  const container = document.getElementById("challenges-stats");
  const mobilePoints = document.getElementById("mobile-points");
  if (!container) return;

  const user = getCurrentUser();
  const points = Number(user?.points) || 0;
  const inProgress = [...progress.values()].filter((s) => s === PROGRESS.IN_PROGRESS).length;
  const completed = [...progress.values()].filter((s) => s === PROGRESS.COMPLETED).length;

  if (mobilePoints) {
    mobilePoints.textContent = `${points.toLocaleString("es-ES")} pts`;
  }

  container.innerHTML = `
    <div class="challenges-stat">
      <span class="challenges-stat-label">${t("challenges.statPoints")}</span>
      <span class="challenges-stat-value">${points.toLocaleString("es-ES")}</span>
    </div>
    <div class="challenges-stat">
      <span class="challenges-stat-label">${t("challenges.statActive")}</span>
      <span class="challenges-stat-value">${inProgress}</span>
    </div>
    <div class="challenges-stat">
      <span class="challenges-stat-label">${t("challenges.statCompleted")}</span>
      <span class="challenges-stat-value">${completed}</span>
    </div>
  `;
}

/** Retos que pasan la pestaña y la búsqueda actuales. */
function visibleChallenges() {
  const query = normalizeText(searchQuery);

  return allChallenges.filter((challenge) => {
    const matchesTab = currentTab === "todos" || stateOf(challenge) === currentTab;
    const matchesSearch =
      includesNormalized(challenge.name, query) ||
      includesNormalized(challenge.description, query);
    return matchesTab && matchesSearch;
  });
}

function renderGrid() {
  const container = document.getElementById("challenges-grid");
  if (!container) return;

  const list = visibleChallenges();

  if (list.length === 0) {
    container.innerHTML = emptyStateFor(currentTab);
    return;
  }

  container.innerHTML = list
    .map((challenge) => challengeCard({ ...challenge, state: stateOf(challenge) }))
    .join("");

  container.querySelectorAll("[data-challenge-id]:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(btn.dataset.challengeId));
  });
}

function emptyStateFor(tab) {
  if (!getCurrentUser() && tab !== "todos") {
    return `
      <div class="challenges-empty">
        <p>${t("challenges.emptyLogin")}</p>
        <a href="/login" class="btn btn--primary" data-link>${t("challenges.loginCta")}</a>
      </div>
    `;
  }

  const messages = {
    todos: t("challenges.emptyAll"),
    [PROGRESS.IN_PROGRESS]: t("challenges.emptyInProgress"),
    [PROGRESS.COMPLETED]: t("challenges.emptyCompleted"),
  };

  return `
    <div class="challenges-empty">
      <p>${messages[tab] ?? messages.todos}</p>
    </div>
  `;
}

function showGridError() {
  const container = document.getElementById("challenges-grid");
  if (!container) return;
  container.innerHTML = `
    <div class="challenges-empty">
      <p>${t("challenges.error")}</p>
    </div>
  `;
}

// ── Detalle del reto ──────────────────────────────────────────

/**
 * Abre el modal de detalle con la acción que corresponde al estado:
 * comenzar, completar/abandonar, o nada si ya está finalizado.
 */
function openDetail(challengeId) {
  const challenge = allChallenges.find((item) => item.id === challengeId);
  if (!challenge) return;

  const state = stateOf(challenge);
  const user = getCurrentUser();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box challenge-detail" role="dialog" aria-modal="true" aria-label="${escapeHtml(challenge.name)}">
      <div class="challenge-detail-media">
        <img src="${escapeHtml(challenge.image)}" alt="" loading="lazy">
        <span class="challenge-card-points">${t("cards.ptsBadge", { points: escapeHtml(challenge.points) })}</span>
      </div>
      <div class="challenge-detail-body">
        <div class="challenge-detail-tags">
          <span class="badge badge-default">${escapeHtml(challenge.type)}</span>
          <span class="badge badge-default">${escapeHtml(challenge.difficulty)}</span>
          ${
            state === PROGRESS.IN_PROGRESS
              ? `<span class="badge challenge-badge-active">${t("challenges.inProgressBadge")}</span>`
              : ""
          }
        </div>
        <h2 class="challenge-detail-title">${escapeHtml(challenge.name)}</h2>
        <p class="challenge-detail-desc">${escapeHtml(challenge.description)}</p>
        <p class="challenge-detail-deadline">${t("challenges.availableUntil", { date: formatDate(challenge.deadline) })}</p>
        <p class="challenge-detail-feedback" data-feedback hidden></p>
        <div class="modal-actions">
          ${detailActions(state, Boolean(user))}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    document.removeEventListener("keydown", onKeydown);
    overlay.remove();
  };
  const onKeydown = (event) => {
    if (event.key === "Escape") close();
  };
  document.addEventListener("keydown", onKeydown);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector("[data-action=close]")?.addEventListener("click", close);

  overlay.querySelector("[data-action=start]")?.addEventListener("click", async () => {
    const result = await setChallengeState(challenge.id, PROGRESS.IN_PROGRESS);
    if (!result.ok) {
      showDetailFeedback(overlay, result.error);
      return;
    }
    progress = getMyProgress();
    close();
    render();
  });

  overlay.querySelector("[data-action=abandon]")?.addEventListener("click", async () => {
    const result = await setChallengeState(challenge.id, PROGRESS.AVAILABLE);
    if (!result.ok) {
      showDetailFeedback(overlay, result.error);
      return;
    }
    progress = getMyProgress();
    close();
    render();
  });

  overlay.querySelector("[data-action=complete]")?.addEventListener("click", async () => {
    const result = await setChallengeState(challenge.id, PROGRESS.COMPLETED);
    if (!result.ok) {
      showDetailFeedback(overlay, result.error);
      return;
    }
    progress = getMyProgress();

    if (isApiEnabled("challenges")) {
      // El backend registró el avance: si el intento quedó FINALIZADO, los
      // puntos ya están en el ledger. Solo hay que refrescar la caché local.
      await refreshSessionPoints().catch(() => {});
      if (result.state !== PROGRESS.COMPLETED) {
        // Aún faltan objetivos para completar el reto: se informa en el
        // propio modal y se deja abierto.
        showDetailFeedback(overlay, t("challenges.progressFeedback"));
        render();
        return;
      }
    } else {
      // Modo local: sin ledger, el crédito de puntos se hace a mano como
      // siempre, para que el saldo cambie también en el panel admin.
      const current = getCurrentUser();
      if (current) {
        const newPoints = (Number(current.points) || 0) + (Number(challenge.points) || 0);
        await updateUser(current.id, { points: newPoints });
        updateSessionUser({ points: newPoints });
      }
    }

    close();
    render();
  });
}

/** Muestra un mensaje del servidor dentro del modal de detalle. */
function showDetailFeedback(overlay, message) {
  const el = overlay.querySelector("[data-feedback]");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

/** Botones del modal según el estado del reto y la sesión. */
function detailActions(state, isLoggedIn) {
  if (!isLoggedIn) {
    return `
      <a href="/login" class="btn-primary" data-link>${t("challenges.loginToJoin")}</a>
      <button type="button" class="btn-outline" data-action="close">${t("challenges.close")}</button>
    `;
  }

  if (state === PROGRESS.IN_PROGRESS) {
    return `
      <button type="button" class="btn-outline" data-action="abandon">${t("challenges.abandon")}</button>
      <button type="button" class="btn-primary" data-action="complete">${t("challenges.complete")}</button>
    `;
  }

  return `
    <button type="button" class="btn-outline" data-action="close">${t("challenges.close")}</button>
    <button type="button" class="btn-primary" data-action="start">${t("challenges.start")}</button>
  `;
}
