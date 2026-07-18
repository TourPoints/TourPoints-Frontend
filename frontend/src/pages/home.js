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

// Nº de destinos y retos destacados en la portada. El primer POI se pinta grande.
const FEATURED_COUNT = 5;
const FEATURED_CHALLENGES_COUNT = 3;

export function home() {
  return `
    
    <section class="hero">
    <h1>Descubre la ciudad, gana recompensas y comparte tu experiencia</h1>
    <p>Explora los rincones más interesantes de tu ciudad, completa desafíos únicos y canjea tus puntos por recompensas.</p>
      
    ${searchBar()}


    </section>

    <section class="highlights">
      <div class="hi-text">
        <div>
        <h2>Destinos destacados</h2>
        <p>Lugares populares que te esperan</p>
        </div>
        <a class="link" href="/explore" data-link>Ver todos</a>
      </div>
      <div class="highlights-points" id="home-pois">
        <p class="u-text-center">Cargando destinos destacados...</p>
      </div>
    </section>

    <section class="challenge">
        <div class=challenge-text>
        <h2>Retos destacados</h2>
        <p>Completa desafíos únicos, descubre nuevos lugares y acumula puntos para desbloquear recompensas exclusivas.</p>
        </div>
        <div id="home-challenges">
          <p class="u-text-center">Cargando retos destacados...</p>
        </div>
    </section>

    <section class="steps">
      <h2>Cómo funciona TourPoins</h2>
      <div class="steps-section">
        
        <div class="steps-content">
          
          <!-- Step 1 -->
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-text">
              <h3 class="step-title">Explora y descubre</h3>
              <p class="step-description">Encuentra los lugares más interesantes de la ciudad filtrando por tus gustos.</p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-text">
              <h3 class="step-title">Realiza Check-in</h3>
              <p class="step-description">Visita el lugar, interactúa con la comunidad y acumula puntos en tu perfil.</p>
            </div>
          </div>

          <!-- step 3 -->
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-text">
              <h3 class="step-title">Gana recompensas</h3>
              <p class="step-description">Canjea tus puntos por descuentos, accesos VIP y productos exclusivos.</p>
            </div>
          </div>

        </div>

        <div class="steps-visual">
          <div class="mockup-wrapper">
            <div class="mockup-card mockup-card--small">
            <img src="/public/img/Explorar.jpg" alt="Interfaz principal de la aplicación" class="mockup-img" loading="lazy">
            </div>
            <div class="mockup-card mockup-card--main">
              <img src="/public/img/Explorar.jpg" alt="Interfaz principal de la aplicación" class="mockup-img" loading="lazy">
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
          <h2 class="cta-title">¿Listo para redescubrir tu entorno?</h2>
          <p class="cta-subtitle">Únete a miles de exploradores y empieza a ganar hoy mismo.</p>
        </div>

        <div class="cta-action">
          ${buttonLinks("/register", "Comenzar ahora", "white")} 
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
    container.innerHTML = `<p class="u-text-center">Hubo un error al cargar los destinos destacados.</p>`;
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
    container.innerHTML = `<p class="u-text-center">Hubo un error al cargar los retos destacados.</p>`;
  }
}
