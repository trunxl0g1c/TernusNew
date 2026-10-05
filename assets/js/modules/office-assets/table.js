// modules/office-assets/table.js
import { badge, btn } from '../../components/ui.js';
import { lname } from '../../core/data.js';
import { dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
export function assetsRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  info = html`<strong>${e(r.name)}</strong
    ><span class="sub">${e(r.serial || 'Tanpa serial')} · ${e(lname(r.location))}</span
    ><span class="sub">PIC: ${e(r.pic)} · ${e(r.condition)}</span>`;
  acts =
    btn('Tindakan', 'asset-event', r.id, 'tiny primary') +
    btn('Riwayat', 'asset-history', r.id, 'tiny');
  return [
    html`<strong>${e(r.number)}</strong><span class="sub">${dt(r.date)}</span>`,
    info,
    badge(status),
    html`<div class="actions">${acts || '—'}</div>`,
  ];
}
