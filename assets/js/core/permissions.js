// core/permissions.js
import { state } from './state.js';
export const admin = () => state.user && state.user.role !== 'sales';
export const owner = () => state.user && state.user.role === 'owner';
export function allowed(p) {
  if (!state.user || (['users', 'settings'].includes(p) && !owner())) return false;
  return (
    state.user.role !== 'sales' ||
    [
      'dashboard',
      'stock',
      'quotes',
      'orders',
      'shipments',
      'invoices',
      'payments',
      'products',
      'customers',
    ].includes(p)
  );
}
