import "/src/styles/molecules/searchBar.css";


export function searchBar() {
  return `

        <form class="search-bar" role="search">

            <label for="search-poi" class="sr-only"> Buscar puntos de interés </label>
            <i data-lucide="search"></i>  
            <input id="search-poi" type="search" class="search-input" placeholder="¿Qué lugar quieres descubrir hoy?" aria-label="Buscar" autocomplete="off">

            <button type="submit" class="btn btn--primary" aria-label="Buscar"> Buscar </button>

        </form>
    `;
}
