import "/src/styles/organism/footer.css";

export function footer() {
  return `
    <footer class="footer-global">
        <div class="footer-container">
        <div class="footer-info">
            <div class="logo-container"> 
            <img src="/public/icons/isotipo_tourPoints_blanco.svg" alt="TourPoints Logo" class="logo-footer">
            <a href="/" class="logo--blanco">TourPoints</a>
            </div>
                <p>Haciendo que cada paso por la ciudad cuente. La plataforma lider en gamificacion de turismo local.</p>
            </div>
            <div class="footer-links">
                <h4>Explora</h4>
                <ul>
                    <li><a href="" data-link>Destinos</a></li>
                    <li><a href="" data-link>Retos</a></li>
                    <li><a href="" data-link>Empresas</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>Compania</h4>
                <ul>
                    <li><a href="" data-link>Sobre nosotros</a></li>
                    <li><a href="" data-link>Blog</a></li>
                    <li><a href="" data-link>Contacto</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>Legal</h4>
                <ul>
                    <li><a href="" data-link>Privacidad</a></li>
                    <li><a href="" data-link>Terminos</a></li>
                    <li><a href="" data-link>Cookies</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 TourPoints Inc. All rights reserved.</p>
            <div class="footer-social">
                <a href="#" aria-label="Instagram">
                  <svg class="lucide lucide-instagram" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" aria-label="YouTube">
                  <svg class="lucide lucide-youtube" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                    <path d="m10 15 5-3-5-3z"></path>
                  </svg>
                </a>
                <a href="#" aria-label="Web"><i data-lucide="globe"></i></a>
            </div>
        </div>
    </footer>
  `;
}
