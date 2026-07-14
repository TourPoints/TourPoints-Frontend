import "/src/styles/organism/footer.css";

export function footer() {
  return `
    <footer class="footer-global">
        <div class="footer-container">
            <div class="footer-info">
                <div class="logo-container">
                    <img src="./public/icons/isotipo_tourPoints_blanco.svg" alt="TourPoints Logo" class="logo-footer">
                    <a href="/" class="logo--blanco" data-link>TourPoints</a>
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
                <a href="#" aria-label="Instagram"><i data-lucide="instagram"></i></a>
                <a href="#" aria-label="YouTube"><i data-lucide="youtube"></i></a>
                <a href="#" aria-label="Web"><i data-lucide="globe"></i></a>
            </div>
        </div>
    </footer>
  `;
}
