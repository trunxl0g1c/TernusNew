// core/data.js
import { state } from './state.js';
export const get = (type, id) => state.data[type].find((x) => x.id === id) || {};
export const pname = (id) => get('products', id).name || '—';
export const lname = (id) => get('locations', id).name || '—';
export const bname = (id) => get('batches', id).number || '—';
export const opts = (type) => Object.assign(state.data[type].filter((x) => x.active).map((x) => [x.id, x.name]), { entityType: type });
