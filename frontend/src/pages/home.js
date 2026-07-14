import "../styles/pages/home.css";
import { searchBar } from "../components/molecules/searchBar.js";
import { poiGrid } from "../components/organism/poiGrid.js";
import { challengeGrid } from "../components/organism/challengeGrid.js";
import { buttonLinks } from "../components/atoms/buttonLinks.js";

const mockPois = [
  {
    id: 1,
    name: "Letrero de Barranquilla",
    category: "Monumento",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    rating: 5.0,
    points: 250,
    description:
      "Parada fotográfica obligatoria con las coloridas letras de la ciudad y una gran vista panorámica.",
  },
  {
    id: 2,
    name: "Cafetería Central",
    category: "Gastronomía",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    rating: 4.8,
    points: 50,
    description:
      "El mejor café artesanal del centro histórico, ideal para descansar y probar bocados típicos locales.",
  },
  {
    id: 3,
    name: "Parque del Escultor",
    category: "Naturaleza",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    rating: 4.5,
    points: 100,
    description:
      "Un espacio verde lleno de esculturas modernas al aire libre, perfecto para caminar o hacer ejercicio.",
  },
  {
    id: 4,
    name: "Restaurante Vista Nocturna",
    category: "Gastronomía",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    rating: 4.9,
    points: 150,
    description:
      "Disfruta de una cena gourmet con la mejor perspectiva iluminada de toda la ciudad desde las alturas.",
  },
  {
    id: 5,
    name: "Playa de la Niebla",
    category: "Aventura",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    rating: 4.7,
    points: 80,
    description:
      "Un rincón costero tranquilo para desconectarse del ruido urbano y contemplar el amanecer.",
  },
];
const mockChallenges = [
  {
    id: 1,
    name: "Cazador de Monumentos",
    points: 350,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    description:
      "Visita y tómate una foto en 3 monumentos icónicos de la ciudad, incluyendo el Letrero de Barranquilla.",
  },
  {
    id: 2,
    name: "Ruta del Sabor Local",
    points: 150,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    description:
      "Haz check-in en 2 cafeterías o restaurantes del centro histórico y desbloquea el sabor tradicional.",
  },
  {
    id: 3,
    name: "Explorador del Río",
    points: 400,
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSflsGufn-Yokun0Kpct3Yiciet2lkpOB_1IZFgwS31NA&s=10",
    description:
      "Camina por el Gran Malecón del Río durante el atardecer y registra tu visita para ganar el puntaje máximo.",
  },
];

export function home() {
  return `
    
    <section class="hero">
    <h1>Descubre la ciudad,gana recompensas y comparte tu experiencia</h1>
    <p>Explora los rincones más interesantes de tu ciudad, completa desafíos únicos y canjea tus puntos por recompensas.</p>
      
    ${searchBar()}


    </section>

    <section class="highlights">
      <div class="hi-text">
        <div>
        <h2>Destinos destacados</h2>
        <p>Lugares populares que te esperan</p>
        </div>
        <a class="link" href="" data-link>Ver todos</a> 
      </div>
      <div class="highlights-points">
        ${poiGrid(mockPois)}
      </div>
    </section>

    <section class="challenge">
        <div class=challenge-text>
        <h2>Retos destacados</h2>
        <p>Completa desafíos únicos, descubre nuevos lugares y acumula puntos para desbloquear recompensas exclusivas.</p>
        </div>
        ${challengeGrid(mockChallenges)}
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
