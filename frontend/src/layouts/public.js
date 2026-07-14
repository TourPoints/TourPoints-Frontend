import { header } from "../components/organism/header.js";
import { footer } from "../components/organism/footer.js";

export function publicLayout(content) {
  return `
    <div class="public-layout">
      ${header()}
      <main>
        ${content}
      </main>
      ${footer()}
    </div>
  `;
}