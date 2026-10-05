// modules/invoices/table.js
import { badge, btn } from '../../components/ui.js';
import { dateNow, dt, e, rup } from '../../core/format.js';
import { html } from '../../core/html.js';
import { admin, owner } from '../../core/permissions.js';
export function invoicesRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info = html`${e(r.customer_name)}<span class="sub"
      >Total ${rup(r.total)} · Sisa <strong>${rup(r.outstanding)}</strong></span
    ><span class="sub">Jatuh tempo ${dt(r.due)}</span>`;
  acts = btn('Cetak / PDF', 'print-invoice', r.id, 'tiny');
  if (status === 'DRAFT') acts += btn('Terbitkan', 'invoice-issue', r.id, 'tiny primary');
  if (status === 'ISSUED') {
    if (r.outstanding && admin()) acts += btn('Bayar', 'pay', r.id, 'tiny primary');
    if (owner()) {
      acts += btn('Nota Kredit', 'credit', r.id, 'tiny');
      if (r.refundable) acts += btn('Refund', 'refund', r.id, 'tiny');
    }
    status = r.outstanding
      ? r.due < dateNow()
        ? 'Lewat jatuh tempo'
        : r.paid
          ? 'Dibayar sebagian'
          : 'Belum dibayar'
      : 'Lunas';
  }
  acts += btn('Riwayat', 'invoice-history', r.id, 'tiny');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
