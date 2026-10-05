import { html } from '../core/html.js';
// components/actions.js
import { addLine } from './line-items.js';
import { showDetail } from './modal.js';
import { labels, notice, table } from './ui.js';
import { bname, get, pname } from '../core/data.js';
import { modal } from '../core/dom.js';
import { exportCSV } from '../core/download.js';
import { e, num, units } from '../core/format.js';
import { state } from '../core/state.js';
export async function handleClose(act, id, button) {
  if (state.busy) return;
  (button?.closest('dialog') || modal).close();
  return;
}
export async function handleMenu(act, id, button) {
  document.querySelector('.sidebar').classList.toggle('open');
  return;
}
export async function handleExport(act, id, button) {
  exportCSV();
  return;
}
export async function handleAddLine(act, id, button) {
  addLine();
  return;
}
export async function handleRemoveLine(act, id, button) {
  button.closest('tr').remove();
  return;
}
export async function handlePrint(act, id, button) {
  window.print();
  return;
}
export async function handleRecordDetail(act, id, button) {
  const d = get(state.currentPage, id);
  let rows = (d.lines || d.inputs || []).map((l) => {
    const b = get('batches', l.batch),
      p = get('products', l.product || b.product);
    return [
      e(p.name || l.name),
      e(b.number || '—'),
      l.qty !== undefined ? units(l.qty, p) : units(l.system, p),
      l.physical !== undefined && l.physical !== null
        ? units(l.physical, p)
        : l.received !== undefined
          ? units(l.received, p)
          : '—',
    ];
  });
  let contentMarkup = table(['Barang', 'Batch', 'Jumlah', 'Diterima / fisik'], rows);
  if (state.currentPage === 'productions') {
    contentMarkup =
      notice(
        'Status ' +
          labels[d.status] +
          (d.loss !== undefined ? ' · Susut ' + num(d.loss / 1000) + ' kg' : ''),
      ) +
      contentMarkup +
      html`<h3 class="mt-6">Hasil produksi</h3>` +
      table(
        ['Barang', 'Batch', 'Hasil'],
        d.outputs.map((l) => [
          e(pname(l.product)),
          e(bname(l.batch)),
          units(l.qty, get('products', l.product)),
        ]),
      );
  }
  showDetail(d.number, contentMarkup);
  return;
}
export const commonActions = {
  close: handleClose,
  menu: handleMenu,
  export: handleExport,
  'add-line': handleAddLine,
  'remove-line': handleRemoveLine,
  print: handlePrint,
  'record-detail': handleRecordDetail,
  'production-detail': handleRecordDetail,
};
