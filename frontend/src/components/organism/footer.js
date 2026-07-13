import "/src/styles/organism/footer.css";

export function footer() {
  return `
    <footer class="footer-global">
        <div class="footer-container">
        <div class="footer-info">
            <div class="logo-container"> 
            <img src="./public/icons/isotipo_tourPoints_blanco.svg" alt="TourPoints Logo" class="logo-footer">
            <a href="/" class="logo--blanco">TourPoints</a>
            </div>
            <p>Haciendo que cada paso por la ciudad cuente.</p> 
            <p>La plataforma líder en gamificación de turismo local.</p>
        </div>
        <div class="footer-links">
            <h4>Legal</h4>
            <ul>
            <li><a href="">Política de privacidad</a></li>
            <li><a href="">Términos de servicio</a></li>
            </ul>
        </div>
        </div>  
        <div class="footer-bottom">
        <p>&copy; 2026 TourPoints. Todos los derechos reservados.</p>
        </div>
    </footer>
    `;
}
