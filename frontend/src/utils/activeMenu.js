export function updateActiveMenu() {
  // 1. Obtenemos la ruta limpia actual (ej: "/" o "/login")
  const currentPath = window.location.pathname;

  // 2. Buscamos todos los enlaces del menú en la pantalla
  const menuLinks = document.querySelectorAll(".menu");

  menuLinks.forEach((link) => {
    // 3. Obtenemos el valor del href del enlace actual
    const linkPath = link.getAttribute("href");

    // 4. Si coinciden exactamente, le ponemos la clase; si no, se la quitamos
    if (linkPath === currentPath) {
      link.classList.add("menu-active");
    } else {
      link.classList.remove("menu-active");
    }
  });
}
