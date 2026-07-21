import { apiGet, isApiEnabled, ApiError } from "./api.client.js";
import { readCollection, writeCollection, nextPrefixedId } from "./localStore.js";

// Fábrica de servicios CRUD.
//
// Retos, recompensas y usuarios comparten exactamente la misma forma de
// persistencia, así que se genera desde aquí en lugar de repetir el mismo
// archivo tres veces. Los POIs tienen su propio servicio porque su modelo
// es más rico (coordenadas, galería, estados de publicación).

/**
 * Crea un servicio CRUD sobre una colección.
 * @param {Object} config - Configuración del servicio.
 * @param {string} config.collection - Nombre de la colección en localStorage.
 * @param {Array<Object>} config.seed - Datos semilla.
 * @param {string} config.idPrefix - Prefijo de los ids, p.ej. "CHL".
 * @param {string} config.apiPath - Ruta base en la API, p.ej. "/admin/challenges".
 * @param {Object} [config.defaults] - Valores por defecto al crear.
 * @param {Array<string>} [config.numericFields] - Campos a convertir a número.
 * @returns {Object} Servicio con list/getById/create/update/remove/toggleStatus.
 */
export function createCrudService({
  collection,
  seed,
  idPrefix,
  apiPath,
  defaults = {},
  numericFields = [],
}) {
  /** Normaliza los campos numéricos que llegan como texto desde el formulario. */
  const coerce = (data) => {
    const result = { ...data };
    numericFields.forEach((field) => {
      if (result[field] !== undefined && result[field] !== "") {
        result[field] = Number(result[field]);
      }
    });
    return result;
  };

  return {
    /**
     * Lista todos los elementos.
     * @returns {Promise<Array<Object>>}
     */
    async list() {
      if (isApiEnabled(collection)) return apiGet(apiPath);
      return readCollection(collection, seed);
    },

    /**
     * Busca un elemento por id.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
      if (isApiEnabled(collection)) {
        try {
          return await apiGet(`${apiPath}/${id}`);
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) return null;
          throw error;
        }
      }

      const item = readCollection(collection, seed).find(
        (entry) => String(entry.id) === String(id)
      );
      return item ? { ...item } : null;
    },

    /**
     * Crea un elemento nuevo generando su id.
     * @param {Object} data
     * @returns {Promise<Object>} El elemento creado.
     */
    async create(data) {
      const items = readCollection(collection, seed);
      const item = { ...defaults, ...coerce(data), id: nextPrefixedId(items, idPrefix) };
      writeCollection(collection, [...items, item]);
      return item;
    },

    /**
     * Actualiza un elemento existente.
     * @param {string} id
     * @param {Object} changes
     * @returns {Promise<Object|null>} El elemento actualizado, o null si no existe.
     */
    async update(id, changes) {
      const items = readCollection(collection, seed);
      const index = items.findIndex((entry) => String(entry.id) === String(id));
      if (index === -1) return null;

      items[index] = { ...items[index], ...coerce(changes), id: items[index].id };
      writeCollection(collection, items);
      return items[index];
    },

    /**
     * Elimina un elemento.
     * @param {string} id
     * @returns {Promise<boolean>} true si se eliminó algo.
     */
    async remove(id) {
      const items = readCollection(collection, seed);
      const remaining = items.filter((entry) => String(entry.id) !== String(id));
      if (remaining.length === items.length) return false;

      writeCollection(collection, remaining);
      return true;
    },

    /**
     * Alterna el estado de un elemento entre dos valores.
     * @param {string} id
     * @param {[string, string]} states - Par de estados a alternar.
     * @returns {Promise<Object|null>} El elemento actualizado.
     */
    async toggleStatus(id, states) {
      const item = await this.getById(id);
      if (!item) return null;

      const [on, off] = states;
      return this.update(id, { status: item.status === on ? off : on });
    },
  };
}
