// layout/shell.js
import { toast } from '../components/feedback.js';
import { recordsPage } from '../components/records-page.js';
import { btn } from '../components/ui.js';
import { mutate } from '../core/api.js';
import { app } from '../core/dom.js';
import { e } from '../core/format.js';
import { html } from '../core/html.js';
import { allowed, owner } from '../core/permissions.js';
import { state } from '../core/state.js';
import { nav, titles } from './navigation.js';
import { dashboard } from '../modules/dashboard/page.js';
import { masterPage } from '../modules/master-data/page.js';
import { bindMasterInlineEdit } from '../modules/master-data/inline-edit.js';
import { settingsPage } from '../modules/settings/page.js';
import { stockPage } from '../modules/stock/page.js';
import { pageEnabled } from '../core/business.js';
import { bindBusinessSettings } from '../modules/settings/business.js';
import { auditPage, bindAuditPage } from '../modules/audit/page.js';
export function render() {
  // The shell is replaced on navigation and state refresh; retain sidebar position.
  const previousSidebar = app.querySelector('.sidebar');
  const sidebarScrollTop = previousSidebar?.scrollTop ?? 0;
  const sidebarScrollLeft = previousSidebar?.scrollLeft ?? 0;
  const inactiveHistoryOpen = previousSidebar?.querySelector('.inactive-history')?.open ?? false;
  state.currentPage = location.hash.slice(1) || 'dashboard';
  if (!allowed(state.currentPage) || !titles[state.currentPage]) state.currentPage = 'dashboard';
  const markup = nav
    .map(([group, items]) => {
      const visible = items.filter(
        ([id]) => allowed(id) && pageEnabled(id) && (id !== 'users' || owner()) && (id !== 'settings' || owner()),
      );
      return visible.length
        ? html`<div class="nav-label">${group}</div>
            ${visible
              .map(
                ([id, icon, title]) =>
                  html`<a class="nav-item ${id === state.currentPage ? 'active' : ''}" href="#${id}"
                    ><span class="nav-icon">${icon}</span>${title}</a
                  >`,
              )
              .join('')}`
        : '';
    })
    .join('');
  const inactive = nav.flatMap(([, items]) => items).filter(([id]) => allowed(id) && !pageEnabled(id));
  const history = inactive.length
    ? html`<details class="inactive-history" ${inactiveHistoryOpen || inactive.some(([id]) => id === state.currentPage) ? 'open' : ''}>
        <summary>Riwayat modul nonaktif</summary>
        ${inactive.map(([id, icon, title]) => html`<a class="nav-item ${id === state.currentPage ? 'active' : ''}" href="#${id}"><span class="nav-icon">${icon}</span>${e(title)}</a>`).join('')}
      </details>`
    : '';
  app.innerHTML = html`<div class="shell">
    <aside class="sidebar">
      <a class="brand" href="#dashboard"
        ><div class="brandmark">T</div>
        <div><strong>TERNUS</strong><small>OPERATIONS</small></div></a
      >
      <nav>${markup}${history}</nav>
      <div class="sidebar-bottom">${e(state.data.settings.company)}<br />Ruang kerja operasional</div>
    </aside>
    <div class="content">
      <header class="topbar">
        ${btn('☰', 'menu', '', 'quiet menu-toggle')}
        <div class="crumb">Ruang kerja &nbsp; / &nbsp; ${e(titles[state.currentPage])}</div>
        <div class="user">
          <span class="avatar">${e(state.user.name.slice(0, 1).toUpperCase())}</span>
          <div>
            <div class="user-name">${e(state.user.name)}</div>
            <div class="role">${e(state.user.role)}</div>
          </div>
          ${btn('Keluar', 'logout', '', 'quiet')}
        </div>
      </header>
      <main class="main" id="main"></main>
    </div>
  </div>`;
  renderPage();
  const sidebar = app.querySelector('.sidebar');
  if (sidebar) {
    sidebar.scrollTop = sidebarScrollTop;
    sidebar.scrollLeft = sidebarScrollLeft;
  }
}
export function renderPage() {
  const main = document.querySelector('#main');
  if (!main) return;
  if (state.currentPage === 'dashboard') main.innerHTML = dashboard();
  else if (
    ['products', 'customers', 'suppliers', 'terms', 'locations', 'users'].includes(
      state.currentPage,
    )
  )
    main.innerHTML = masterPage();
  else if (state.currentPage === 'stock') main.innerHTML = stockPage();
  else if (state.currentPage === 'settings') main.innerHTML = settingsPage();
  else if (state.currentPage === 'audit') main.innerHTML = auditPage();
  else main.innerHTML = recordsPage();
  if (!pageEnabled(state.currentPage)) {
    main.insertAdjacentHTML('afterbegin', '<div class="notice module-readonly" role="status">Modul ini nonaktif. Riwayat tetap tersedia untuk dilihat, dicetak, dan diekspor. Aktifkan kembali di Pengaturan Bisnis untuk melanjutkan transaksi.</div>');
  }
  bindMasterInlineEdit();
  bindBusinessSettings();
  bindAuditPage(renderPage);
  const input = document.querySelector('#search');
  if (input)
    input.oninput = () => {
      const pos = input.selectionStart;
      state.searchQuery = input.value;
      renderPage();
      const next = document.querySelector('#search');
      next.focus();
      next.setSelectionRange(pos, pos);
    };
  const lf = document.querySelector('#locfilter');
  if (lf)
    lf.onchange = () => {
      state.locationFilter = lf.value;
      renderPage();
    };
  const ar = document.querySelector('#archive-toggle');
  if (ar)
    ar.onchange = () => {
      state.showArchived = ar.checked;
      state.selected.clear();
      renderPage();
    };
  const all = document.querySelector('#select-all');
  if (all)
    all.onchange = () => {
      document.querySelectorAll('[data-select]').forEach((c) => {
        c.checked = all.checked;
        if (all.checked) state.selected.add(c.dataset.select);
        else state.selected.delete(c.dataset.select);
      });
    };
  document
    .querySelectorAll('[data-select]')
    .forEach(
      (c) =>
        (c.onchange = () =>
          c.checked
            ? state.selected.add(c.dataset.select)
            : state.selected.delete(c.dataset.select)),
    );
  const sf = document.querySelector('#settings-form');
  if (sf)
    sf.onsubmit = async (ev) => {
      ev.preventDefault();
      try {
        await mutate('settings', Object.fromEntries(new FormData(sf)));
      } catch (err) {
        toast(err.message);
      }
    };
}
