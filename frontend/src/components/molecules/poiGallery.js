import "/src/styles/molecules/poiGallery.css";

export function poiGallery({ images = [], name = "" }) {
  const galleryImages = images.length > 0 ? images : [];
  const mainImage = galleryImages[0] || "";
  const thumbnails = galleryImages.slice(1, 4);

  const thumbsHtml = thumbnails
    .map(
      (img, index) => `
      <button class="poi-gallery-thumb" data-index="${index + 1}" aria-label="Ver imagen ${index + 2}">
        <img src="${img}" alt="${name} - imagen ${index + 2}" loading="lazy">
      </button>
    `
    )
    .join("");

  const showAllBtn =
    galleryImages.length > 1
      ? `
    <button class="poi-gallery-view-all" id="poi-gallery-view-all" aria-label="Ver todas las imágenes">
      <i data-lucide="layout-grid"></i>
      <span>Ver todas</span>
    </button>
  `
      : "";

  return `
    <section class="poi-gallery" aria-label="Galería de imágenes">
      <div class="poi-gallery-main">
        <img
          id="poi-gallery-main-img"
          src="${mainImage}"
          alt="${name}"
          class="poi-gallery-main-img"
        >
      </div>
      ${
        thumbnails.length > 0
          ? `
        <div class="poi-gallery-thumbs">
          ${thumbsHtml}
          ${showAllBtn}
        </div>
      `
          : ""
      }
    </section>
  `;
}

export function initPoiGallery(images = []) {
  const mainImg = document.getElementById("poi-gallery-main-img");
  const thumbs = document.querySelectorAll(".poi-gallery-thumb");
  const viewAllBtn = document.getElementById("poi-gallery-view-all");

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const index = Number(thumb.getAttribute("data-index"));
      const newMain = images[index];
      const oldMain = mainImg.src;

      mainImg.src = newMain;
      thumb.querySelector("img").src = oldMain;
      images[0] = newMain;
      images[index] = oldMain;
    });
  });

  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      alert(`Galería completa: ${images.length} imágenes disponibles. Se conectará al backend para ver el álbum completo.`);
    });
  }
}
