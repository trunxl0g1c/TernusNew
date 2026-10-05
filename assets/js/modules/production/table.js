// modules/production/table.js
import { badge, btn } from '../../components/ui.js';
import { lname } from '../../core/data.js';
import { dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
export function productionsRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info =
    e(r.kind) +
    '<span class="sub">' +
    e(lname(r.location)) +
    ' · ' +
    r.inputs.length +
    ' batch input</span>';
  acts = btn('Detail', 'production-detail', r.id, 'tiny');
  if (status === 'IN_PROGRESS')
    acts += btn('Selesaikan', 'production-complete', r.id, 'tiny primary');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
