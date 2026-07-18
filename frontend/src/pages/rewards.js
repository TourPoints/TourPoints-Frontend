import { rewardCard } from "../components/molecules/rewardCard.js";
import { getRewards, redeemReward } from "../services/reward.service.js";
import { isApiEnabled } from "../services/api.client.js";
import { openConfirmModal, escapeHtml } from "../components/organism/modal.js";
import { formatDate } from "../utils/date.js";
import { REWARD_CATEGORIES } from "../mocks/rewards.js";
import { getCurrentUser } from "../services/auth.service.js";
import { refreshSessionPoints } from "../services/points.service.js";
import { loadIcons } from "../utils/icons.js";
import "/src/styles/pages/rewards.css";

// Antes esta página usaba REWARDS_DATA/CATEGORIES hardcodeados que no
// tenían relación con lo que gestiona el panel admin (services/reward.service.js),
// así que lo que un admin creaba o desactivaba nunca se veía aquí. Ahora se
// lee del mismo servicio, con la categoría/estado reales del modelo.

const ALL_CATEGORIES_ID = "todos";

// Icono de Lucide por categoría de recompensa. No comparte taxonomía con las
// categorías de POI (Naturaleza/Cultura/...), así que tiene su propio mapa.
const CATEGORY_ICONS = {
  "Restauración": "utensils-crossed",
  "Alojamiento": "landmark",
  "Cultura": "landmark",
  "Souvenirs": "shopping-bag",
  "Actividades": "compass",
  [ALL_CATEGORIES_ID]: "layout-grid",
};

let allRewards = [];
let currentCategory = ALL_CATEGORIES_ID;

export function rewards() {
  return `
    <section class="rewards-page">
      <div class="rewards-hero">
        <div class="rewards-hero-text">
          <h1 class="rewards-hero-title">Canjea tus puntos</h1>
          <p class="rewards-hero-subtitle">Usa tus puntos acumulados para obtener descuentos, pases VIP y merchandising exclusivo de los mejores destinos.</p>
        </div>
        <div class="rewards-points-card">
          <div class="rewards-points-icon">
            <span class="rewards-points-letter">P</span>
          </div>
          <div class="rewards-points-info">
            <span class="rewards-points-label">PUNTOS TOTALES</span>
            <span class="rewards-points-value" id="rewards-points-value">-- pts</span>
          </div>
        </div>
      </div>

      <div class="rewards-filters" id="rewards-filters"></div>

      <div class="rewards-grid" id="rewards-grid">
        <p class="u-text-center">Cargando recompensas...</p>
      </div>
    </section>
  `;
}

export async function initRewards() {
  currentCategory = ALL_CATEGORIES_ID;

  // Contra el backend hasta el listado de recompensas exige sesión: sin ella
  // se invita a entrar en vez de enseñar una lista vacía inexplicable.
  if (isApiEnabled("rewards") && !getCurrentUser()) {
    renderUserPoints();
    const grid = document.getElementById("rewards-grid");
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Inicia sesión para ver y canjear las recompensas.</p>
          <a href="/login" class="btn btn--primary" data-link>Iniciar sesión</a>
        </div>
      `;
    }
    return;
  }

  // El saldo vive en el ledger del backend; la sesión es solo caché.
  await refreshSessionPoints().catch(() => {});
  renderUserPoints();

  try {
    allRewards = await getRewards();
  } catch (error) {
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
  pointsEl.textContent = user ? `${Number(user.points || 0).toLocaleString("es-ES")} pts` : "Inicia sesión";
}

function renderFilters() {
  const container = document.getElementById("rewards-filters");
  if (!container) return;

  const categories = [ALL_CATEGORIES_ID, ...REWARD_CATEGORIES];

  container.innerHTML = categories
    .map(
      (category) => `
      <button class="filter-btn ${category === currentCategory ? "filter-btn--active" : ""}" data-category="${category}">
        <i data-lucide="${CATEGORY_ICONS[category] ?? "layout-grid"}"></i>
        ${category === ALL_CATEGORIES_ID ? "Todos" : category}
      </button>
    `
    )
    .join("");

  container.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.category;
      container.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.toggle("filter-btn--active", b.dataset.category === currentCategory);
      });
      renderGrid();
      loadIcons();
    });
  });

  loadIcons();
}

function getVisibleRewards() {
  return allRewards.filter((reward) => {
    if (reward.status !== "Activo") return false;
    if (currentCategory !== ALL_CATEGORIES_ID && reward.category !== currentCategory) return false;
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
        <p>No hay recompensas disponibles en esta categoría por ahora.</p>
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
    title: `Canjear: ${reward.name}`,
    message: `Este canje descuenta ${reward.pointsCost.toLocaleString("es-ES")} puntos de tu saldo (${saldo.toLocaleString("es-ES")} pts). ¿Continuar?`,
    confirmLabel: "Canjear",
  });
  if (!confirmed) return;

  const result = await redeemReward(rewardId);

  if (!result.ok) {
    await openConfirmModal({ title: "No se pudo canjear", message: result.error, confirmLabel: "Entendido" });
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
    <div class="modal-box modal-box--sm" role="dialog" aria-modal="true" aria-label="Canje realizado">
      <div class="modal-header">
        <h2 class="modal-title">¡Canje realizado!</h2>
        <button type="button" class="modal-close" aria-label="Cerrar">&times;</button>
      </div>
      <p class="modal-message">
        Presenta este código en <strong>${escapeHtml(canje.recompensa)}</strong> para redimir tu recompensa.
        ${canje.expira ? `Vence el ${escapeHtml(formatDate(String(canje.expira).slice(0, 10)))}.` : ""}
      </p>
      <p class="rewards-redeem-code"><code>${escapeHtml(canje.codigoQr)}</code></p>
      <div class="modal-actions">
        <button type="button" class="btn-primary modal-confirm">Entendido</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".modal-close").addEventListener("click", close);
  overlay.querySelector(".modal-confirm").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}

function showErrorState() {
  const container = document.getElementById("rewards-grid");
  if (!container) return;
  container.innerHTML = `
    <div class="error-state">
      <p>Hubo un error al cargar las recompensas. Por favor, intenta de nuevo.</p>
    </div>
  `;
}
