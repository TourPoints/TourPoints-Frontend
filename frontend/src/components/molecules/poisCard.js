import "/src/styles/molecules/poiCard.css";

export function poiCard({
  id,
  name,
  category,
  image,
  rating,
  points,
  typePoints,
  isFeatured = false,
}) {
  // Cambiamos la clase si es la tarjeta principal destacada
  const cardClass = isFeatured
    ? "poi-card poi-card-featured"
    : "poi-card";

  return `
    <article class="${cardClass}" data-id="${id}">
      <div class="poi-card-img-container">
        <img src="${image}" alt="${name}" class="poi-card-img" loading="lazy">
        <span class="poi-card-points"> +${points} puntos</span>
        <button class="btn-heart" aria-label="Guardar en favoritos">
          <i data-lucide="heart"></i>  
        </button>
        ${isFeatured ? `<span class="category">${category}</span>` : ""}
        ${
          isFeatured
            ? `
          <div class="poi-card-featured-overlay">
            <span class="category">${category}</span>
            <h3 class="poi-card-title">${name}</h3>
          </div>
        `
            : ""
        }
      </div>

      ${
        !isFeatured
          ? `
        <div class="poi-card-content">
          <div class="pois-card-header-info">
            <span class="category">${category}</span>
            <div class="poi-card-rating">
              <i data-lucide="star"></i>  
              <span>${rating.toFixed(1)}</span>
            </div>
          </div>
          <h3 class="poi-card-title">${name}</h3>
          <p class="pois-card-description">${description} </p>       
        </div>
      `
          : ""
      }
    </article>
  `;
}
