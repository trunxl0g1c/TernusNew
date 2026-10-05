// components/page.js
import { btn } from './ui.js';
import { e } from '../core/format.js';
import { html } from '../core/html.js';
import { state } from '../core/state.js';
import { titles } from '../layout/navigation.js';
export function header(title, desc, actions = '') {
  return html`<div class="page-heading">
    <div>
      <div class="eyebrow">${e(state.data?.settings?.company || 'TERNUS')} / ${e(titles[state.currentPage])}</div>
      <h1>${e(title)}</h1>
      <p class="muted">${e(desc)}</p>
    </div>
    <div class="actions">${actions}</div>
  </div>`;
}
export function toolbar(extra = '') {
  return html`<div class="toolbar">
    <input
      class="search"
      id="search"
      placeholder="Cari nama, nomor, atau status…"
      value="${e(state.searchQuery)}"
    />${extra}<span class="spacer"></span>${btn('Ekspor CSV', 'export', '', 'tiny')}
  </div>`;
}
export function filtered(rows) {
  const q = state.searchQuery.toLowerCase();
  return rows.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q));
}
