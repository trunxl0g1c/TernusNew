// modules/payments/table.js
import { badge } from '../../components/ui.js';
import { get } from '../../core/data.js';
import { dt, e, rup } from '../../core/format.js';
import { html } from '../../core/html.js';
export function paymentsRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info =
    rup(r.amount) +
    '<span class="sub">' +
    e(get('invoices', r.invoice).number) +
    ' · ' +
    e(r.note) +
    '</span>';
  status = 'Terverifikasi';
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
