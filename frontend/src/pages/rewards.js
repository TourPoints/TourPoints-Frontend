import { rewardCard } from "../components/molecules/rewardCard.js";
import { getRewards } from "../services/reward.service.js";
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
