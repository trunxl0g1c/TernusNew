import { relatedCreate } from './components/related-create.js';
import { initSearchableSelects } from './components/searchable-select.js';
import { boot } from './core/bootstrap.js';
import { action } from './core/actions.js';
import { state } from './core/state.js';
import { toast } from './components/feedback.js';
import { render } from './layout/shell.js';
window.addEventListener('ternus:state-changed', render);
document.addEventListener('click', async (ev) => {
  const button = ev.target.closest('[data-act]');
  if (!button) return;
  ev.preventDefault();
  if (button.disabled) return;
  button.disabled = true;
  try {
    await action(button.dataset.act, button.dataset.id, button);
  } catch (err) {
    toast(err.message);
  } finally {
    button.disabled = false;
  }
});
window.addEventListener('hashchange', () => {
  state.searchQuery = '';
  state.locationFilter = '';
  state.selected.clear();
  if (state.data) render();
});
initSearchableSelects({ relatedCreate });
boot();
