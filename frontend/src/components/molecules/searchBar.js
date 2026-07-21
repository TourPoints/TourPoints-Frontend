import { t } from "../../i18n/index.js";
import "/src/styles/molecules/searchBar.css";


export function searchBar() {
  return `

        <form class="search-bar" role="search">

            <label for="search-poi" class="sr-only"> ${t("search.srLabel")} </label>
            <i data-lucide="search"></i>
            <input id="search-poi" type="search" class="search-input" placeholder="${t("search.placeholder")}" aria-label="${t("search.aria")}" autocomplete="off">

            <button type="submit" class="btn btn--primary" aria-label="${t("search.aria")}"> ${t("search.button")} </button>

        </form>
    `;
}
