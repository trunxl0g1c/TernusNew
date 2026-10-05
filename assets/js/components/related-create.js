import { load } from '../core/api.js';
import { state } from '../core/state.js';
import { pageEnabled } from '../core/business.js';
import { masterForm } from '../modules/master-data/form.js';
import { openForm } from './modal.js';
import { toast } from './feedback.js';
const labels = { customers: 'pelanggan', suppliers: 'vendor', locations: 'lokasi', products: 'barang' };
let child = null;
function allowed(select) {
  const type = select.dataset.createType, role = state.user?.role;
  return Boolean(labels[type] && pageEnabled(type) && (['owner', 'admin'].includes(role) || (role === 'sales' && type === 'customers')));
}
function optionLabel(record, type) {
  return type === 'products' ? record.name + (record.sku ? ' · ' + record.sku : '') + ' · ' + record.unit : record.name;
}
function open(select, trigger) {
  if (child || state.busy || !select.isConnected || select.matches(':disabled') || !allowed(select)) return;
  const type = select.dataset.createType;
  let saved = null;
  const dialog = document.createElement('dialog'); dialog.id = 'related-create-modal';
  dialog.className = 'related-create-dialog'; dialog.setAttribute('aria-label', 'Tambah ' + labels[type]);
  document.body.append(dialog); child = dialog;
  dialog.addEventListener('cancel', event => { if (state.busy) event.preventDefault(); });
  // Stop child close actions here so a caller without the global action router is also safe.
  dialog.addEventListener('click', event => {
    const close = event.target.closest('[data-act="close"]');
    if (!close) return;
    event.preventDefault(); event.stopPropagation();
    if (!state.busy) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialog.remove(); if (child === dialog) child = null;
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
  }, { once: true });
  try {
    masterForm(null, {
      type,
      open: (title, markup, save, button) => openForm(title, markup, async (values, form) => {
        if (!allowed(select)) throw Error('Anda tidak berhak menambah data ini.');
        if (type === 'products' && select.dataset.createSale && values.sell !== 'on')
          throw Error('Aktifkan Boleh dijual agar barang dapat dipilih pada penjualan ini.');
        if (saved) { await load(); return saved; }
        saved = await save(values, form);
        return saved;
      }, button, {
        dialog,
        onSaved: response => {
          const id = response?.id;
          const record = state.data[type]?.find(item => item.id === id);
          if (!record) throw Error('Data tersimpan tetapi belum termuat. Coba muat ulang data.');
          // Update related choices in the still-open parent without replacing any form nodes.
          for (const target of document.querySelectorAll('select[data-create-type]')) {
            if (target.dataset.createType !== type || (target.dataset.createSale && !record.sell)) continue;
            let option = [...target.options].find(item => item.value === id);
            if (!option) { option = document.createElement('option'); option.value = id; target.append(option); }
            option.textContent = optionLabel(record, type);
          }
          if (select.isConnected) {
            select.value = id;
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        },
      }),
    });
  } catch (error) {
    dialog.remove(); child = null; toast(error.message);
  }
}
export const relatedCreate = { allowed, label: select => labels[select.dataset.createType], open };
