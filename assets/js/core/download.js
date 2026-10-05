// core/download.js
import { dateNow } from './format.js';
import { state } from './state.js';
export function exportCSV() {
  const safe = (x) => {
    let s = String(x ?? '');
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  };
  download(
    '\uFEFF' +
      [state.exportHeads, ...state.exportRows].map((r) => r.map(safe).join(';')).join('\r\n'),
    `ternus-${state.currentPage}-${dateNow()}.csv`,
    'text/csv',
  );
}
export function download(data, name, type) {
  const url = URL.createObjectURL(
    new Blob([data], {
      type,
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
