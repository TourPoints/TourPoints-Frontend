import "../styles/pages/home.css";
import { searchBar } from "../components/molecules/searchBar.js";
import { poiGrid } from "../components/organism/poiGrid.js";
import { initFavoriteButtons } from "../components/molecules/poisCard.js";
import { challengeGrid } from "../components/organism/challengeGrid.js";
import { buttonLinks } from "../components/atoms/buttonLinks.js";
import { getPois } from "../services/poi.service.js";
import { getChallenges } from "../services/challenge.service.js";
import { navigate } from "../router/router.js";
import { refreshMyFavorites } from "../services/favorite.service.js";
import { loadIcons } from "../utils/icons.js";
import { t } from "../i18n/index.js";

// Nº de destinos y retos destacados en la portada. El primer POI se pinta grande.
const FEATURED_COUNT = 5;
const FEATURED_CHALLENGES_COUNT = 3;

export function home() {
  return `
    
    <section class="hero">
    <h1>${t("home.heroTitle")}</h1>
    <p>${t("home.heroSubtitle")}</p>
      
    ${searchBar()}


    </section>

    <section class="highlights">
      <div class="hi-text">
        <div>
        <h2>${t("home.featuredTitle")}</h2>
        <p>${t("home.featuredSubtitle")}</p>
        </div>
        <a class="link" href="/explore" data-link>${t("home.viewAll")}</a>
      </div>
      <div class="highlights-points" id="home-pois">
        <p class="u-text-center">${t("home.loadingPois")}</p>
      </div>
    </section>

    <section class="challenge">
        <div class=challenge-text>
        <h2>${t("home.challengesTitle")}</h2>
        <p>${t("home.challengesSubtitle")}</p>
        </div>
        <div id="home-challenges">
          <p class="u-text-center">${t("home.loadingChallenges")}</p>
        </div>
    </section>

    <section class="steps">
      <h2>${t("home.howTitle")}</h2>
      <div class="steps-section">
        
        <div class="steps-content">
          
          <!-- Step 1 -->
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-text">
              <h3 class="step-title">${t("home.step1Title")}</h3>
              <p class="step-description">${t("home.step1Desc")}</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-text">
              <h3 class="step-title">${t("home.step2Title")}</h3>
              <p class="step-description">${t("home.step2Desc")}</p>
            </div>
          </div>

          <!-- step 3 -->
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-text">
              <h3 class="step-title">${t("home.step3Title")}</h3>
              <p class="step-description">${t("home.step3Desc")}</p>
            </div>
          </div>

        </div>

        <div class="steps-visual">
          <div class="mockup-wrapper">
            <div class="mockup-card mockup-card--small">
            <img src="/img/Explorar.jpg" alt="Interfaz principal de la aplicación" class="mockup-img" loading="lazy">
            </div>
            <div class="mockup-card mockup-card--main">
              <img src="/img/Explorar.jpg" alt="Interfaz principal de la aplicación" class="mockup-img" loading="lazy">
              <div class="mockup-phone"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="cta">
      <div class="cta-container">
        
        <!-- 🌀 Círculos decorativos abstractos de fondo -->
        <div class="decor-circle decor-circle--top-right"></div>
        <div class="decor-circle decor-circle--bottom-left"></div>
        
        <div class="cta-text-group">
          <h2 class="cta-title">${t("home.ctaTitle")}</h2>
          <p class="cta-subtitle">${t("home.ctaSubtitle")}</p>
        </div>

        <div class="cta-action">
          ${buttonLinks("/register", t("home.ctaButton"), "white")}
        </div>

      </div>
    </section>
  `;
}

/**
 * Carga los destinos y retos destacados con datos reales.
 * Antes los POIs nunca se pintaban (getPois() se importaba pero no se
 * llamaba) y los retos venían hardcodeados en este archivo.
 */
export async function initHome() {
  const poisContainer = document.getElementById("home-pois");
  const challengesContainer = document.getElementById("home-challenges");

  bindHeroSearch();

  // Los corazones del grid destacado leen la caché de favoritos en síncrono.
  await refreshMyFavorites().catch(() => {});

  await Promise.all([loadFeaturedPois(poisContainer), loadFeaturedChallenges(challengesContainer)]);

  loadIcons();
}

/**
 * El buscador de la portada lleva a Explora con la búsqueda ya aplicada.
 *
 * Antes nadie lo enganchaba: el formulario hacía submit nativo, recargaba la
 * página entera contra "/?" —tirando la SPA abajo— y encima perdía el texto,
 * porque el input no tiene atributo name. Era un buscador decorativo.
 *
 * La portada no tiene dónde mostrar resultados, así que la búsqueda no se
 * resuelve aquí: se delega en Explora, que ya tiene grid, filtros y paginación.
 */
function bindHeroSearch() {
  const form = document.querySelector(".search-bar");
  const input = document.getElementById("search-poi");
  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = input.value.trim();
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : "/explore");
  });
}

async function loadFeaturedPois(container) {
  if (!container) return;

  try {
    const pois = await getPois();
    container.innerHTML = poiGrid(pois.slice(0, FEATURED_COUNT));
    initFavoriteButtons(container);
  } catch (error) {
    console.error("Error al cargar los destinos destacados:", error);
    container.innerHTML = `<p class="u-text-center">${t("home.errorPois")}</p>`;
  }
}

async function loadFeaturedChallenges(container) {
  if (!container) return;

  try {
    const challenges = await getChallenges();
    const featured = challenges
      .filter((challenge) => challenge.status === "Activo")
      .slice(0, FEATURED_CHALLENGES_COUNT);
    container.innerHTML = challengeGrid(featured);
  } catch (error) {
    console.error("Error al cargar los retos destacados:", error);
    container.innerHTML = `<p class="u-text-center">${t("home.errorChallenges")}</p>`;
  }
}
