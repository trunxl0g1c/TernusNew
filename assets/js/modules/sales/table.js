// modules/sales/table.js
import { badge, btn } from '../../components/ui.js';
import { lname } from '../../core/data.js';
import { dt, e, rup } from '../../core/format.js';
import { html } from '../../core/html.js';
import { admin } from '../../core/permissions.js';
export function quotesRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info =
    e(r.customer_name) +
    '<span class="sub">' +
    rup(r.total) +
    ' · berlaku ' +
    dt(r.valid_until) +
    '</span>';
  acts = btn('Cetak', 'print-quote', r.id, 'tiny');
  if (status === 'DRAFT') acts += btn('Diterima', 'quote-accept', r.id, 'tiny');
  if (status === 'ACCEPTED')
    acts += btn('Assign to Invoice', 'quote-convert', r.id, 'tiny primary');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
export function ordersRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info =
    e(r.customer_name) +
    '<span class="sub">' +
    rup(r.total) +
    ' · ' +
    e(lname(r.location)) +
    '</span>';
  if (status === 'DRAFT') acts += btn('Konfirmasi', 'order-confirm', r.id, 'tiny primary');
  if (['CONFIRMED', 'PARTIAL'].includes(status) && admin())
    acts += btn('Kirim', 'ship', r.id, 'tiny primary');
  if (status !== 'CANCELLED') acts += btn('Invoice', 'invoice-create', r.id, 'tiny');
  if (['DRAFT', 'CONFIRMED'].includes(status))
    acts += btn('Batal', 'order-cancel', r.id, 'tiny danger');
  acts += btn('Detail', 'record-detail', r.id, 'tiny');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
