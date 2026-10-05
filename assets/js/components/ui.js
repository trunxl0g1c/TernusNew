// components/ui.js
import { e } from '../core/format.js';
import { html } from '../core/html.js';
import { actionEnabled } from '../core/business.js';
export const labels = {
  DRAFT: 'Draft',
  ACCEPTED: 'Diterima',
  CONVERTED: 'Dikonversi',
  CONFIRMED: 'Dikonfirmasi',
  PARTIAL: 'Sebagian terkirim',
  FULFILLED: 'Terkirim',
  CANCELLED: 'Dibatalkan',
  ISSUED: 'Terbit',
  VOID: 'Batal',
  POSTED: 'Disahkan',
  IN_PROGRESS: 'Dalam proses',
  COMPLETED: 'Selesai',
  IN_TRANSIT: 'Dalam perjalanan',
  PARTIAL_RECEIVED: 'Diterima sebagian',
  RECEIVED: 'Diterima',
  COUNTING: 'Penghitungan',
  SUBMITTED: 'Menunggu owner',
  APPROVED: 'Disetujui',
  AVAILABLE: 'Tersedia',
  IN_USE: 'Digunakan',
  ON_LOAN: 'Dipinjam',
  MAINTENANCE: 'Perawatan',
  RETIRED: 'Dihapuskan',
  QUARANTINE: 'Karantina',
  RELEASED: 'Lolos inspeksi',
  SHIPPED: 'Terkirim',
};
export const badge = (s) =>
  html`<span
    class="badge ${[
      'COMPLETED',
      'FULFILLED',
      'APPROVED',
      'RECEIVED',
      'ISSUED',
      'AVAILABLE',
      'RELEASED',
    ].includes(s)
      ? 'good'
      : ['CANCELLED', 'VOID', 'RETIRED'].includes(s)
        ? 'bad'
        : 'warn'}"
    >${e(labels[s] || s)}</span
  >`;
export const btn = (label, act, id = '', cls = '') =>
  actionEnabled(act, id)
    ? html`<button class="btn ${cls}" data-act="${e(act)}" data-id="${e(id)}">${e(label)}</button>`
    : '';
export const notice = (t) => html`<div class="notice">${e(t)}</div>`;
export const empty = (
  t = 'Belum ada transaksi',
  sub = 'Mulai dengan menambahkan data baru melalui tombol di atas.',
) =>
  html`<div class="empty">
    <div class="empty-icon">◇</div>
    <strong>${e(t)}</strong>${e(sub)}
  </div>`;
export const panel = (title, body, action = '') =>
  html`<section class="panel">
    <div class="panel-head">
      <h3>${e(title)}</h3>
      ${action}
    </div>
    ${body}
  </section>`;
export const table = (heads, rows) =>
  rows.length
    ? html`<div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${heads.map((x) => html`<th>${x}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  html`<tr>
                    ${r.map((c) => html`<td>${c ?? ''}</td>`).join('')}
                  </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>`
    : empty();
export function stat(title, value, note, icon) {
  return html`<div class="stat">
    <span class="stat-mark">${icon}</span>
    <div class="stat-label">${title}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-note">${note}</div>
  </div>`;
}
