import {buttonLinks} from "../atoms/buttonLinks.js";
import "../../styles/organism/header.css";
import { clearRole } from "../../utils/role.js";

function handleLogout() {
  clearRole();
  window.location.href = '/';
}
window.handleLogout = handleLogout;

export function header() {
  return `
    <header class="header-global"> 
      <div class="nav-container">
      <img src="/public/icons/isotipo_tourPoints.svg" alt="TourPoints Logo" class="logo-footer">
      <a href="/" class="logo">TourPoints</a>
      <nav class="navegation">
        <a class="menu" href="/" data-link>Inicio</a>
        <a class="menu" href="/explore" data-link>Explora</a>
        <a class="menu" href="" data-link>Retos</a>
        <a class="menu" href="/recompensas" data-link>Recompensas</a>
        <a class="menu" href="/map" data-link>Mapa</a>
      </nav>
      </div>
      <div class="buttons-container">
      ${buttonLinks("/login", "Iniciar Sesion", "secondary")} 
      ${buttonLinks("/register", "Registrarse", "primary")}
      <button class="logout-button" onclick="handleLogout()">Logout</button>
      </div>
      <button class="user-button">
      <i data-lucide="circle-user-round"></i> 
      </button>
    </header>
    `;
}

