import { rewardCard } from "../components/molecules/rewardCard.js";
import "/src/styles/pages/rewards.css";

const REWARDS_DATA = [
  {
    id: 1,
    name: "Cata de Vinos Premium",
    description: "Disfruta de una seleccion exclusiva en el Vinedo del Sol. Incluye degustacion guiada y maridaje.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    points: 500,
    isClaimed: false,
  },
  {
    id: 2,
    name: "Cata de Vinos Premium",
    description: "Disfruta de una seleccion exclusiva en el Vinedo del Sol. Incluye degustacion guiada y maridaje.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    points: 500,
    isClaimed: false,
  },
  {
    id: 3,
    name: "Cata de Vinos Premium",
    description: "Disfruta de una seleccion exclusiva en el Vinedo del Sol. Incluye degustacion guiada y maridaje.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    points: 500,
    isClaimed: false,
  },
  {
    id: 4,
    name: "Escapada de Fin de Semana",
    description: "Dos noches todo incluido en el Resort Mar Azul. Maximo confort.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    points: 5000,
    isClaimed: true,
  },
];

const CATEGORIES = [
  { id: "todos", label: "Todos", icon: "layout-grid" },
  { id: "cultura", label: "Cultura", icon: "landmark" },
  { id: "naturaleza", label: "Naturaleza", icon: "trees" },
  { id: "gastronomia", label: "Gastronomia", icon: "utensils-crossed" },
  { id: "religioso", label: "Religioso", icon: "church" },
  { id: "compras", label: "Compras", icon: "shopping-bag" },
];

export function rewards() {
  const filtersHTML = CATEGORIES.map((cat, i) => `
    <button class="filter-btn ${i === 0 ? "filter-btn--active" : ""}" data-category="${cat.id}">
      <i data-lucide="${cat.icon}"></i>
      ${cat.label}
    </button>
  `).join("");

  const cardsHTML = REWARDS_DATA.map((r) => rewardCard(r)).join("");

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
            <span class="rewards-points-value">2,450 pts</span>
          </div>
        </div>
      </div>

      <div class="rewards-filters">
        ${filtersHTML}
      </div>

      <div class="rewards-grid">
        ${cardsHTML}
      </div>
    </section>
  `;
}
