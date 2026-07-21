import { t } from "../../i18n/index.js";
import "/src/styles/organism/footer.css";

export function footer() {
  return `
    <footer class="footer-global">
        <div class="footer-container">
        <div class="footer-info">
            <div class="logo-container"> 
            <img src="/icons/isotipo_tourPoints_blanco.svg" alt="TourPoints Logo" class="logo-footer">
            <a href="/" class="logo--blanco">TourPoints</a>
            </div>
                <p>${t("footer.tagline")}</p>
            </div>
            <div class="footer-links">
                <h4>${t("footer.explore")}</h4>
                <ul>
                    <li><a href="" data-link>${t("footer.destinations")}</a></li>
                    <li><a href="" data-link>${t("footer.challenges")}</a></li>
                    <li><a href="" data-link>${t("footer.companies")}</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>${t("footer.company")}</h4>
                <ul>
                    <li><a href="" data-link>${t("footer.about")}</a></li>
                    <li><a href="" data-link>${t("footer.blog")}</a></li>
                    <li><a href="" data-link>${t("footer.contact")}</a></li>
                </ul>
            </div>
            <div class="footer-links">
                <h4>${t("footer.legal")}</h4>
                <ul>
                    <li><a href="" data-link>${t("footer.privacy")}</a></li>
                    <li><a href="" data-link>${t("footer.terms")}</a></li>
                    <li><a href="" data-link>${t("footer.cookies")}</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <p>${t("footer.rights")}</p>
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
