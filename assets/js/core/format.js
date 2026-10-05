// core/format.js
export const e = (v) =>
  String(v ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[c],
  );
export const rup = (v) => 'Rp ' + Number(v || 0).toLocaleString('id-ID');
export const num = (v) =>
  Number(v || 0).toLocaleString('id-ID', {
    maximumFractionDigits: 3,
  });
export const dateNow = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const dt = (v) =>
  v
    ? new Date(v.length === 10 ? v + 'T12:00:00' : v).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
export const units = (q, p) => num(q / (p.unit === 'kg' ? 1000 : 1)) + ' ' + (p.unit || '');
export const qval = (q, p) => q / (p.unit === 'kg' ? 1000 : 1);
