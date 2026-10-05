// Enhance native selects while preserving names, IDs, validation and existing change handlers.
const controls = new WeakMap();
let active = null, serial = 0, started = false, relatedCreate = null;
const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
export function matchingOptions(select, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return [...select.options].filter(option => !option.hidden && !option.disabled &&
    !option.closest('optgroup')?.disabled && words.every(word =>
      normalize(option.textContent + ' ' + (option.dataset.search || '')).includes(word)));
}
function label(select) {
  return select.getAttribute('aria-label') || [...(select.labels || [])].map(x => x.textContent.trim()).join(' ') ||
    select.closest('td')?.closest('table')?.querySelector('th')?.textContent.trim() ||
    (select.id === 'locfilter' ? 'Lokasi' : select.name || 'Pilihan');
}
function sync(control) {
  const { select, input, toggle } = control;
  input.disabled = select.matches(':disabled'); toggle.disabled = input.disabled;
  input.setAttribute('aria-required', String(select.required));
  if (active !== control) {
    const text = select.options[select.selectedIndex]?.textContent.trim() || '';
    input.value = !select.value && /^pilih/i.test(text) ? '' : text;
  }
  const add = control.wrapper.querySelector('.search-select-create');
  if (add) add.disabled = input.disabled;
  if (input.disabled && active === control) close();
}
function close() {
  if (!active) return;
  const current = active; active = null;
  current.panel.remove(); current.input.setAttribute('aria-expanded', 'false');
  current.input.removeAttribute('aria-activedescendant');
  sync(current);
}
function place() {
  if (!active) return;
  const { input, panel, select } = active;
  if (!select.isConnected || select.closest('dialog:not([open])')) { close(); return; }
  const r = input.getBoundingClientRect(), viewport = window.visualViewport;
  const height = viewport?.height || window.innerHeight, top = viewport?.offsetTop || 0;
  const width = viewport?.width || window.innerWidth;
  const below = top + height - r.bottom - 8, above = r.top - top - 8;
  const upwards = below < 160 && above > below;
  const maxHeight = Math.max(60, Math.min(280, upwards ? above : below));
  const panelWidth = Math.max(0, Math.min(Math.max(r.width, 260), width - 16));
  Object.assign(panel.style, {
    width: panelWidth + 'px', maxHeight: maxHeight + 'px',
    left: Math.max(8, Math.min(r.left, width - panelWidth - 8)) + 'px',
    top: (upwards ? Math.max(top + 8, r.top - Math.min(panel.scrollHeight, maxHeight) - 4) : r.bottom + 4) + 'px',
  });
}
function highlight(control, index) {
  control.index = index;
  [...control.panel.children].forEach((node, i) => node.classList.toggle('is-active', i === index));
  const node = control.panel.children[index];
  if (!node || !control.results.length) { control.input.removeAttribute('aria-activedescendant'); return; }
  control.input.setAttribute('aria-activedescendant', node.id);
  const list = control.panel;
  if (node.offsetTop < list.scrollTop) list.scrollTop = node.offsetTop;
  else if (node.offsetTop + node.offsetHeight > list.scrollTop + list.clientHeight)
    list.scrollTop = node.offsetTop + node.offsetHeight - list.clientHeight;
}
function choose(control, option) {
  if (control.select.matches(':disabled') || option.disabled || !option.isConnected) return;
  const changed = control.select.value !== option.value;
  control.select.value = option.value;
  control.input.removeAttribute('aria-invalid');
  close();
  if (changed) {
    control.select.dispatchEvent(new Event('input', { bubbles: true }));
    control.select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // Existing handlers can replace the entire form/page; never focus a detached input.
  if (control.input.isConnected) sync(control);
}
function renderOptions(control, query = '') {
  control.results = matchingOptions(control.select, query);
  control.panel.replaceChildren();
  for (const [i, option] of control.results.entries()) {
    const row = document.createElement('div');
    row.className = 'search-select-option'; row.id = control.panel.id + '-' + i;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(option.selected));
    row.textContent = option.textContent.trim();
    row.addEventListener('mousedown', event => event.preventDefault());
    row.addEventListener('click', () => choose(control, option));
    control.panel.append(row);
  }
  if (!control.results.length) {
    const empty = document.createElement('div');
    empty.className = 'search-select-empty'; empty.setAttribute('role', 'status');
    empty.textContent = 'Tidak ada hasil. Coba kata lain.'; control.panel.append(empty);
  }
  place();
  const selected = query ? 0 : control.results.findIndex(option => option.selected);
  highlight(control, control.results.length ? Math.max(0, selected) : -1);
}
function open(control, query = '') {
  if (control.select.matches(':disabled')) return;
  if (active !== control) {
    close(); active = control;
    // A modal dialog's descendants share its top layer and remain interactive.
    (control.select.closest('dialog') || document.body).append(control.panel);
    control.input.setAttribute('aria-expanded', 'true');
  }
  renderOptions(control, query);
}
function enhance(select) {
  if (controls.has(select) || select.multiple || select.size > 1) return;
  const wasFocused = document.activeElement === select;
  const maxWidth = window.getComputedStyle(select).maxWidth;
  const wrapper = document.createElement('span'); wrapper.className = 'search-select';
  if (maxWidth && maxWidth !== 'none') wrapper.style.maxWidth = maxWidth;
  const input = document.createElement('input'); input.type = 'text';
  input.className = 'search-select-input'; input.autocomplete = 'off'; input.spellcheck = false;
  input.placeholder = 'Ketik untuk mencari…'; input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-haspopup', 'listbox'); input.setAttribute('aria-label', label(select));
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.tabIndex = -1;
  toggle.className = 'search-select-toggle'; toggle.textContent = '▾';
  toggle.setAttribute('aria-label', 'Buka pilihan ' + label(select));
  const panel = document.createElement('div'); panel.id = 'search-select-list-' + ++serial;
  panel.className = 'search-select-list'; panel.setAttribute('role', 'listbox');
  panel.addEventListener('mousedown', event => event.preventDefault());
  panel.setAttribute('aria-label', label(select)); input.setAttribute('aria-controls', panel.id);
  const control = { select, wrapper, input, toggle, panel, results: [], index: -1 };
  controls.set(select, control);
  select.before(wrapper); wrapper.append(select, input, toggle);
  select.classList.add('search-select-native'); select.tabIndex = -1; select.setAttribute('aria-hidden', 'true');
  select.addEventListener('change', () => sync(control));
  select.addEventListener('focus', () => { input.focus(); });
  select.addEventListener('invalid', event => {
    event.preventDefault(); input.setAttribute('aria-invalid', 'true'); input.focus(); open(control);
  });
  input.addEventListener('focus', () => { open(control); input.select(); });
  input.addEventListener('click', () => { if (active !== control) { open(control); input.select(); } });
  input.addEventListener('input', () => open(control, input.value));
  input.addEventListener('blur', () => { if (active === control) close(); });
  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); event.stopPropagation();
      if (active !== control) { open(control); return; }
      const n = control.results.length;
      if (n) highlight(control, (control.index + (event.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (active === control && ['Enter', 'Escape'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      if (event.key === 'Escape') close();
      else if (control.results[control.index]) choose(control, control.results[control.index]);
    } else if (event.key === 'Tab') { close(); }
    else if (select.hasAttribute('data-inline-input') && ['Enter', 'Escape'].includes(event.key)) {
      event.preventDefault(); select.dispatchEvent(new KeyboardEvent('keydown', { key: event.key, bubbles: true }));
    }
  });
  toggle.addEventListener('mousedown', event => event.preventDefault());
  toggle.addEventListener('click', () => {
    if (active === control) close(); else { input.focus(); open(control); input.select(); }
  });
  if (relatedCreate?.allowed(select)) {
    const add = document.createElement('button'); add.type = 'button';
    add.className = 'search-select-create';
    add.textContent = '+ Tambah ' + relatedCreate.label(select);
    add.addEventListener('click', () => {
      close();
      if (select.matches(':disabled')) return;
      relatedCreate.open(select, add);
    });
    wrapper.classList.add('search-select-with-create'); wrapper.append(add);
  }
  sync(control);
  if (wasFocused) input.focus();
}
export function initSearchableSelects(options = {}) {
  relatedCreate = options.relatedCreate || relatedCreate;
  if (started) return;
  started = true;
  const scan = root => {
    if (!(root instanceof Element)) return;
    if (root.matches('select')) enhance(root);
    root.querySelectorAll('select').forEach(enhance);
  };
  scan(document.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(scan);
      const select = record.target instanceof Element ? record.target.closest('select') : record.target.parentElement?.closest('select');
      if (select && controls.has(select)) {
        const control = controls.get(select); sync(control);
        if (active === control) renderOptions(control, control.input.value);
      }
      if (record.type === 'attributes' && record.target.matches('fieldset'))
        record.target.querySelectorAll('select').forEach(s => controls.has(s) && sync(controls.get(s)));
    }
    if (active && (!active.select.isConnected || active.select.closest('dialog:not([open])'))) close();
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['disabled', 'required', 'selected', 'hidden', 'open'] });
  document.addEventListener('pointerdown', event => {
    if (active && !active.wrapper.contains(event.target) && !active.panel.contains(event.target)) close();
  }, true);
  document.addEventListener('reset', event => setTimeout(() => {
    close(); event.target.querySelectorAll('select').forEach(s => controls.has(s) && sync(controls.get(s)));
  }, 0));
  window.addEventListener('resize', place);
  document.addEventListener('scroll', event => { if (active && event.target !== active.panel) place(); }, true);
  window.visualViewport?.addEventListener('resize', place);
  window.visualViewport?.addEventListener('scroll', place);
}
