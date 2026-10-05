// modules/returns/table.js
import { badge, btn } from '../../components/ui.js';
import { lname } from '../../core/data.js';
import { dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
export function returnsRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info = e(lname(r.location)) + '<span class="sub">' + e(r.note) + '</span>';
  if (status === 'QUARANTINE')
    acts += btn('Lolos Inspeksi', 'return-release', r.id, 'tiny primary');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
