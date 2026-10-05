// modules/auth/actions.js
import { api } from '../../core/api.js';
export async function handleLogout(act, id, button) {
  await api('logout', {});
  location.reload();
  return;
}
export const authActions = {
  logout: handleLogout,
};
