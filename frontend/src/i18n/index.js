// Internacionalización con i18next + JSON (ES/EN).
//
// Las traducciones viajan empaquetadas en el bundle (imports de JSON, sin
// backend de i18next): con dos idiomas y un solo namespace no compensa cargar
// los ficheros por HTTP. El idioma elegido persiste en localStorage con el
// mismo prefijo que el resto del estado de la app.
//
// Cambiar de idioma NO repinta nada por sí solo: las páginas son template
// strings que se generan al navegar, así que quien cambie el idioma debe
// llamar después a renderRoute() (lo hace el botón del header). Los textos
// que una página pinta en sus init/async usan t() en el momento de pintar,
// por lo que quedan bien con un único repintado.

import i18next from "i18next";
import { normalizeText } from "../utils/text.js";
import es from "./locales/es.json";
import en from "./locales/en.json";

const STORAGE_KEY = "tourpoints:lang";
const DEFAULT_LANG = "es";
export const LANGS = ["es", "en"];

export function getLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return LANGS.includes(stored) ? stored : DEFAULT_LANG;
}

i18next.init({
  lng: getLang(),
  fallbackLng: DEFAULT_LANG,
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  // Los textos se insertan en template strings propios; i18next no debe
  // escapar por su cuenta (los datos de usuario ya pasan por escapeHtml).
  interpolation: { escapeValue: false },
  // Con recursos empaquetados la init es síncrona: t() funciona desde el
  // primer render, sin esperar promesas.
  initImmediate: false,
});

/** Traduce una clave del JSON del idioma activo. */
export const t = (key, options) => i18next.t(key, options);

/**
 * Traduce el nombre de una categoría de POI.
 *
 * Las categorías son DATOS (vienen del backend o de los mocks en español),
 * no claves de interfaz: se buscan por su forma normalizada en el bloque
 * "categories" del JSON y, si el backend añade una categoría que aún no
 * está traducida, se muestra tal cual llegó en vez de romper o enseñar la
 * clave — el filtro sigue funcionando porque el valor de data-category
 * nunca se traduce, solo la etiqueta visible.
 * @param {string} name - Nombre de la categoría tal como viene en los datos.
 * @returns {string}
 */
export function tCategory(name) {
  const key = `categories.${normalizeText(name)}`;
  return i18next.exists(key) ? i18next.t(key) : name;
}

/**
 * Cambia el idioma y lo persiste. El repintado corre a cargo del llamador.
 * @param {"es"|"en"} lang
 */
export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  localStorage.setItem(STORAGE_KEY, lang);
  i18next.changeLanguage(lang);
  document.documentElement.lang = lang;
}

// El atributo lang del documento debe reflejar el idioma real desde el
// arranque (lectores de pantalla, corrección ortográfica del navegador).
document.documentElement.lang = getLang();
