// modules/stock/actions.js
import { batchDetail } from './page.js';
export async function handleGotoStock(act, id, button) {
  location.hash = 'stock';
  return;
}
export async function handleBatch(act, id, button) {
  batchDetail(id);
  return;
}
export const stockActions = {
  'goto-stock': handleGotoStock,
  batch: handleBatch,
};
