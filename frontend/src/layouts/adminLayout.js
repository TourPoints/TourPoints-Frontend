// src/layouts/adminLayout.js
// Layout exclusivo del panel de administración.
// Solo incluye el sidebar; sin header ni footer públicos.

import { sidebar } from "../components/organism/sidebar.js";
import "../styles/pages/admin.css";

export function adminLayout(content) {
  return `
    <div class="admin-wrapper">
      ${sidebar()}
      <main class="admin-main">
        ${content}
      </main>
    </div>
  `;
}
