// i18n antes que el router: el render inicial ocurre al importar router.js,
// y para entonces t() ya tiene que estar listo.
import "./i18n/index.js";
import "./router/router.js";
