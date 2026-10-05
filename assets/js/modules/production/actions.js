// modules/production/actions.js
import { productionComplete, productionStart } from './form.js';
export async function handleProductionStart(act, id, button) {
  productionStart();
  return;
}
export async function handleProductionComplete(act, id, button) {
  productionComplete(id);
  return;
}
export const productionActions = {
  'production-start': handleProductionStart,
  'production-complete': handleProductionComplete,
};
