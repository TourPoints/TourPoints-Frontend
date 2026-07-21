import { rewardCard } from "../components/molecules/rewardCard.js";
import { getRewards, redeemReward } from "../services/reward.service.js";
import { isApiEnabled, ApiError } from "../services/api.client.js";
import { openConfirmModal, escapeHtml } from "../components/organism/modal.js";
import { formatDate } from "../utils/date.js";
import { getCurrentUser } from "../services/auth.service.js";
import { refreshSessionPoints } from "../services/points.service.js";
import { loadIcons } from "../utils/icons.js";
import { t } from "../i18n/index.js";
import "/src/styles/pages/rewards.css";

// Antes esta página filtraba por categoría (Restauración/Alojamiento/...),
// una taxonomía que solo existía en los datos de ejemplo: el modelo real de
// `recompensas` en el backend no tiene columna de categoría ni la hereda de
// ningún POI asociado (recompensas.poi_id es apenas un id suelto, sin
// nombre ni categoría en la respuesta). Contra la API, toda recompensa real
// llegaba con category=undefined y cualquier filtro que no fuera "Todas"
// mostraba la lista vacía. Los filtros ahora usan datos que sí existen para
// cualquier recompensa: si tiene stock, y si el usuario tiene puntos para
// pagarla.

// Función y no constante: las etiquetas deben salir en el idioma activo.
const FILTERS = () => ({
  todas: { label: t("rewards.filterAll"), icon: "layout-grid" },
  disponibles: { label: t("rewards.filterAvailable"), icon: "package-check" },
  alAlcance: { label: t("rewards.filterAffordable"), icon: "wallet" },
});
const DEFAULT_FILTER = "todas";

let allRewards = [];
let currentFilter = DEFAULT_FILTER;

export function rewards() {
  return `
    <section class="rewards-page">
      <div class="rewards-hero">
        <div class="rewards-hero-text">
          <h1 class="rewards-hero-title">${t("rewards.title")}</h1>
          <p class="rewards-hero-subtitle">${t("rewards.subtitle")}</p>
        </div>
        <div class="rewards-points-card">
          <div class="rewards-points-icon">
            <span class="rewards-points-letter">P</span>
          </div>
          <div class="rewards-points-info">
            <span class="rewards-points-label">${t("rewards.totalPoints")}</span>
            <span class="rewards-points-value" id="rewards-points-value">-- pts</span>
          </div>
        </div>
      </div>

      <div class="rewards-filters" id="rewards-filters"></div>

      <div class="rewards-grid" id="rewards-grid">
        <p class="u-text-center">${t("rewards.loading")}</p>
      </div>
    </section>
  `;
}

export async function initRewards() {
  currentFilter = DEFAULT_FILTER;

  // Contra el backend hasta el listado de recompensas exige sesión: sin ella
  // se invita a entrar en vez de enseñar una lista vacía inexplicable.
  if (isApiEnabled("rewards") && !getCurrentUser()) {
    renderUserPoints();
    const grid = document.getElementById("rewards-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>${t("rewards.loginPrompt")}</p>
          <a href="/login" class="btn btn--primary" data-link>${t("rewards.loginCta")}</a>
        </div>
      `;
    }
    return;
  }

  // El saldo vive en el ledger del backend; la sesión es solo caché.
  await refreshSessionPoints().catch(() => {});
  renderUserPoints();

  try {
    allRewards = await getRewards({ throwOnAuthError: true });
  } catch (error) {
    // Con sesión local pero token vencido, el backend responde 401/403: se
    // invita a entrar de nuevo en vez de enseñar un catálogo vacío mentiroso.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      renderSessionExpired();
      return;
    }
    console.error("Error al cargar las recompensas:", error);
    showErrorState();
    return;
  }

  renderFilters();
  renderGrid();
  loadIcons();
}

function renderUserPoints() {
  const pointsEl = document.getElementById("rewards-points-value");
  if (!pointsEl) return;

  const user = getCurrentUser();
  pointsEl.textContent = user ? `${Number(user.points || 0).toLocaleString("es-ES")} pts` : t("rewards.signIn");
}

function renderFilters() {
  const container = document.getElementById("rewards-filters");
  if (!container) return;

  container.innerHTML = Object.entries(FILTERS())
    .map(
      ([key, { label, icon }]) => `
      <button class="filter-btn ${key === currentFilter ? "filter-btn--active" : ""}" data-filter="${key}">
        <i data-lucide="${icon}"></i>
        ${label}
      </button>
    `
    )
    .join("");

  container.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      container.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.toggle("filter-btn--active", b.dataset.filter === currentFilter);
      });
      renderGrid();
      loadIcons();
    });
  });

  loadIcons();
}

function getVisibleRewards() {
  const balance = Number(getCurrentUser()?.points) || 0;

  return allRewards.filter((reward) => {
    if (reward.status !== "Activo") return false;
    if (currentFilter === "disponibles" && reward.stock <= 0) return false;
    if (currentFilter === "alAlcance" && reward.pointsCost > balance) return false;
    return true;
  });
}

function renderGrid() {
  const container = document.getElementById("rewards-grid");
  if (!container) return;

  const visible = getVisibleRewards();

  if (visible.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>${t("rewards.empty")}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = visible
    .map((reward) =>
      rewardCard({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        image: reward.image,
        emoji: reward.emoji,
        points: reward.pointsCost,
        stock: reward.stock,
      })
    )
    .join("");

  // El botón "Canjear" de cada tarjeta existía sin manejador: era decorativo.
  // Ahora canjea de verdad contra el backend (con confirmación previa).
  container.querySelectorAll("[data-reward-id]:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => handleRedeem(btn.dataset.rewardId));
  });
}

/** Flujo de canje: confirmar → canjear en el backend → enseñar el código QR. */
async function handleRedeem(rewardId) {
  const reward = allRewards.find((r) => String(r.id) === String(rewardId));
  if (!reward) return;

  const user = getCurrentUser();
  if (!user) return;

  const saldo = Number(user.points) || 0;
  const confirmed = await openConfirmModal({
    title: t("rewards.redeemTitle", { name: reward.name }),
    message: t("rewards.redeemMessage", {
      cost: reward.pointsCost.toLocaleString("es-ES"),
      balance: saldo.toLocaleString("es-ES"),
    }),
    confirmLabel: t("rewards.redeemConfirm"),
  });
  if (!confirmed) return;

  const result = await redeemReward(rewardId);

  if (!result.ok) {
    await openConfirmModal({ title: t("rewards.redeemFailTitle"), message: result.error, confirmLabel: t("rewards.understood") });
    return;
  }

  // El backend ya descontó stock y puntos: se refresca todo antes de enseñar
  // el código, para que el saldo y el stock de la página digan la verdad.
  await refreshSessionPoints().catch(() => {});
  try {
    allRewards = await getRewards();
  } catch { /* la lista vigente sigue sirviendo */ }
  renderUserPoints();
  renderGrid();
  loadIcons();

  showRedemptionCode(result.canje);
}

/** Modal con el código del canje: es lo que se presenta en el aliado. */
function showRedemptionCode(canje) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box modal-box--sm" role="dialog" aria-modal="true" aria-label="${t("rewards.redeemedAria")}">
      <div class="modal-header">
        <h2 class="modal-title">${t("rewards.redeemedTitle")}</h2>
        <button type="button" class="modal-close" aria-label="${t("rewards.closeAria")}">&times;</button>
      </div>
      <p class="modal-message">
        ${t("rewards.redeemedMessage", { name: escapeHtml(canje.recompensa) })}
        ${canje.expira ? t("rewards.expires", { date: escapeHtml(formatDate(String(canje.expira).slice(0, 10))) }) : ""}
      </p>
      <p class="rewards-redeem-code"><code>${escapeHtml(canje.codigoQr)}</code></p>
      <div class="modal-actions">
        <button type="button" class="btn-primary modal-confirm">${t("rewards.understood")}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector(".modal-confirm").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}

function renderSessionExpired() {
  const grid = document.getElementById("rewards-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div class="empty-state">
      <p>${t("rewards.sessionExpired")}</p>
      <a href="/login" class="btn btn--primary" data-link>${t("rewards.loginCta")}</a>
    </div>
  `;
}

function showErrorState() {
  const container = document.getElementById("rewards-grid");
  if (!container) return;
  container.innerHTML = `
    <div class="error-state">
      <p>${t("rewards.error")}</p>
    </div>
  `;
}
