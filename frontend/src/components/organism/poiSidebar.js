import "/src/styles/organism/poiSidebar.css";

export function poiSidebar({ isFavorite = false, hasVisited = false }) {
  const favoriteLabel = isFavorite ? "Quitar de Favoritos" : "Agregar a Favoritos";
  const favoriteClass = isFavorite ? "poi-sidebar-fav--active" : "";
  const visitLabel = hasVisited ? "Visita Registrada" : "Registrar Visita";
  const visitDisabled = hasVisited ? "disabled" : "";

  return `
    <aside class="poi-sidebar">
      <div class="poi-sidebar-card">
        <button
          id="btn-register-visit"
          class="btn btn--primary poi-sidebar-btn"
          ${visitDisabled}
        >
          <i data-lucide="map-pin-check"></i>
          <span>${visitLabel}</span>
        </button>
        <button
          id="btn-add-favorite"
          class="btn btn--secondary poi-sidebar-btn poi-sidebar-fav ${favoriteClass}"
        >
          <i data-lucide="heart"></i>
          <span>${favoriteLabel}</span>
        </button>
      </div>
    </aside>
  `;
}
