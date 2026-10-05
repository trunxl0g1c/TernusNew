import { state } from './state.js';

export const businessCatalog = () => state.data?.business_catalog || { modules: {}, profiles: {} };
export function businessConfig() {
  const defaultProfile = businessCatalog().profiles.coffee || {};
  const saved = state.data?.settings?.business || {};
  return {
    profile: 'coffee', revision: 0, stages: [], processes: [],
    ...defaultProfile, ...saved,
    modules: { ...defaultProfile.modules, ...saved.modules },
  };
}
export function moduleEnabled(key, config = businessConfig().modules) {
  const definition = businessCatalog().modules[key];
  if (!definition) return true;
  return config[key] !== false && definition.depends.every((dep) => moduleEnabled(dep, config));
}
export function pageModule(page) {
  return Object.entries(businessCatalog().modules).find(([, m]) => m.pages.includes(page))?.[0];
}
export const pageEnabled = (page) => moduleEnabled(pageModule(page));
export function actionEnabled(action, id = '') {
  const modules = businessCatalog().modules;
  if (Object.entries(modules).some(([key, m]) => m.actions.includes(action) && !moduleEnabled(key))) return false;
  if (action === 'production-complete') {
    const record = state.data?.productions?.find((p) => p.id === id);
    if (record?.kind === 'Pengemasan' && !moduleEnabled('packaging')) return false;
  }
  return true;
}
export function updateModuleSelection(selection, key, enabled) {
  const next = { ...selection };
  const modules = businessCatalog().modules;
  if (!modules[key]) return next;
  const enable = (id) => {
    next[id] = true;
    modules[id].depends.forEach(enable);
  };
  if (enabled) enable(key);
  else {
    next[key] = false;
    // Repeat to remove every transitive dependant, regardless of registry order.
    let changed;
    do {
      changed = false;
      for (const [id, definition] of Object.entries(modules)) {
        if (next[id] && definition.depends.some((dep) => !next[dep])) {
          next[id] = false;
          changed = true;
        }
      }
    } while (changed);
  }
  return next;
}
export function productionKinds() {
  const kinds = businessConfig().processes.filter((name) => name !== 'Pengemasan');
  return moduleEnabled('packaging') ? [...kinds, 'Pengemasan'] : kinds;
}
