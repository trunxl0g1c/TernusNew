// modules/stocktakes/table.js
import { badge, btn } from '../../components/ui.js';
import { lname } from '../../core/data.js';
import { dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
import { owner } from '../../core/permissions.js';
export function stocktakesRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info = e(lname(r.location)) + '<span class="sub">' + r.lines.length + ' baris hitungan</span>';
  if (status === 'COUNTING') acts += btn('Input Hitungan', 'opname-count', r.id, 'tiny primary');
  if (status === 'SUBMITTED' && owner())
    acts += btn('Setujui', 'opname-approve', r.id, 'tiny primary');
  if (['COUNTING', 'SUBMITTED'].includes(status))
    acts += btn('Batal', 'opname-cancel', r.id, 'tiny danger');
  acts += btn('Detail', 'record-detail', r.id, 'tiny');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
