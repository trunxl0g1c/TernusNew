// modules/shipping/table.js
import { badge, btn } from '../../components/ui.js';
import { get } from '../../core/data.js';
import { dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
import { admin } from '../../core/permissions.js';
export function shipmentsRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info = e(r.customer_name) + '<span class="sub">' + e(get('orders', r.order).number) + '</span>';
  if (admin()) acts += btn('Retur', 'return-new', r.id, 'tiny');
  acts += btn('Detail', 'record-detail', r.id, 'tiny');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
