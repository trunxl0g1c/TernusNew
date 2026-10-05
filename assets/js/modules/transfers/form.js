// modules/transfers/form.js
import { field, select } from '../../components/fields.js';
import { addLine, lineSection, lines } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { mutate } from '../../core/api.js';
import { opts } from '../../core/data.js';
import { dateNow } from '../../core/format.js';
import { html } from '../../core/html.js';
export function transferSend() {
  openForm(
    'Kirim transfer stok',
    html`<div class="form-grid">
        ${field('date', 'Tanggal kirim', 'date', dateNow(), true)}${select(
          'from',
          'Lokasi asal',
          opts('locations'),
        )}${select('to', 'Lokasi tujuan', opts('locations'))}
      </div>
      ${lineSection('input')}`,
    (a) =>
      mutate('transfer.send', {
        ...a,
        lines: lines(),
      }),
    'Kirim',
  );
  addLine();
}
