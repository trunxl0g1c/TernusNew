// components/records-page.js
import { filtered, header, toolbar } from './page.js';
import { btn, stat, table } from './ui.js';
import { num, rup } from '../core/format.js';
import { html } from '../core/html.js';
import { admin } from '../core/permissions.js';
import { state } from '../core/state.js';
import { descriptors, recordViews } from '../layout/record-registry.js';
export function recordsPage() {
  const [title, desc, newText, newAct] = descriptors[state.currentPage];
  let rows = filtered([...state.data[state.currentPage]].reverse());
  let heads = ['Nomor / tanggal', 'Informasi', 'Status', 'Aksi'];
  let body = rows.map(recordViews[state.currentPage]);
  if (admin() && state.currentPage !== 'audit') {
    body.forEach((cells, i) => { cells[cells.length - 1] += btn('Log aktivitas', 'audit-record', rows[i].id, 'tiny'); });
  }
  if (state.currentPage === 'audit') heads = ['Tanggal', 'Pengguna', 'Aksi', 'Keterangan'];
  state.exportHeads = state.currentPage === 'audit' ? heads : ['Nomor', 'Tanggal', 'Status'];
  state.exportRows = rows.map((r) =>
    state.currentPage === 'audit'
      ? [r.time, r.user, r.op, r.summary]
      : [r.number, r.date, r.status],
  );
  let top = header(
    title,
    desc,
    newAct && (admin() || ['orders', 'quotes'].includes(state.currentPage))
      ? btn(newText, newAct, '', 'primary')
      : '',
  );
  if (state.currentPage === 'invoices') {
    const issued = state.data.invoices.filter((x) => x.status === 'ISSUED');
    top += html`<div class="stats">
      ${stat('Invoice terbit', num(issued.length), 'Tidak termasuk draft', '▧')}${stat(
        'Outstanding',
        rup(issued.reduce((n, r) => n + r.outstanding, 0)),
        'Saldo tagihan aktif',
        '↗',
      )}${stat(
        'Pembayaran',
        rup(state.data.payments.reduce((n, r) => n + r.amount, 0)),
        'Pembayaran terverifikasi',
        '◉',
      )}${stat(
        'Perlu refund',
        rup(issued.reduce((n, r) => n + r.refundable, 0)),
        'Setelah nota kredit',
        '↩',
      )}
    </div>`;
  }
  return top + html`<section class="panel">${toolbar()}${table(heads, body)}</section>`;
}
