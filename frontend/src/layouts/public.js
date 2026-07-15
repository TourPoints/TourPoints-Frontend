import { header } from "../components/organism/header.js";
import { footer } from "../components/organism/footer.js";
import { bottomNav } from "../components/organism/bottomNav.js";

export function publicLayout(content) {
  return `
    <div class="public-layout">
      ${header()}
      <main>
        ${content}
      </main>
      ${footer()}
      ${bottomNav()}
    </div>
  `;
}