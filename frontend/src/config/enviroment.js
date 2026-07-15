// Lectura centralizada de variables de entorno de Vite.
//
// Antes este archivo estaba vacío y sin usar: la lectura de import.meta.env
// vivía embebida directamente en services/api.client.js. Se centraliza aquí
// para que el resto del código no dependa de las claves VITE_* de Vite.
//
// Nota: el nombre del archivo tiene un typo histórico ("enviroment" en vez
// de "environment"). Se mantiene para no romper la import path existente;
// si se reorganiza el proyecto, es buen momento para corregirlo.

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? "",
  mode: import.meta.env.MODE,
};
