// modules/transfers/table.js
import { badge, btn } from '../../components/ui.js';
import { lname } from '../../core/data.js';
import { dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
export function transfersRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info = e(lname(r.from)) + ' → ' + e(lname(r.to));
  acts = btn('Detail', 'record-detail', r.id, 'tiny');
  if (status !== 'RECEIVED') acts += btn('Terima', 'transfer-receive', r.id, 'tiny primary');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
