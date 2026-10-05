// modules/receiving/table.js
import { badge, btn } from '../../components/ui.js';
import { lname } from '../../core/data.js';
import { dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
export function receiptsRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info =
    e(r.source) +
    '<span class="sub">' +
    e(lname(r.location)) +
    ' · ' +
    r.lines.length +
    ' barang</span>';
  acts = btn('Detail', 'record-detail', r.id, 'tiny');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
