// modules/receiving/form.js
import { field, select } from '../../components/fields.js';
import { addLine, lineSection, lines } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { notice } from '../../components/ui.js';
import { mutate } from '../../core/api.js';
import { opts } from '../../core/data.js';
import { dateNow } from '../../core/format.js';
import { html } from '../../core/html.js';
import { businessConfig } from '../../core/business.js';
export function receiveForm() {
  const coffee = businessConfig().profile === 'coffee';
  openForm(
    'Penerimaan barang',
    html`<div class="form-grid">
        ${field('date', 'Tanggal', 'date', dateNow(), true)}${select(
          'location',
          'Lokasi penerimaan',
          opts('locations'),
        )}${select(
          'source',
          'Sumber',
          [
            ['Kebun sendiri', coffee ? 'Kebun sendiri' : 'Sumber internal'],
            ['Vendor', coffee ? 'Vendor / petani' : 'Vendor / pemasok'],
            ['Saldo awal', 'Saldo awal'],
          ],
          coffee ? 'Kebun sendiri' : 'Vendor',
        )}${select('supplier', 'Vendor', opts('suppliers'), '', false)}${field(
          'origin',
          'Keterangan asal barang',
          'text',
          coffee ? 'Kebun sendiri' : 'Pemasok',
        )}
      </div>
      ${notice(
        'Periksa satuan dan total biaya sebelum mengesahkan. Penerimaan langsung menambah stok; tidak dapat diedit setelah disahkan.',
      )}${lineSection('receive')}`,
    (a) =>
      mutate('receive', {
        ...a,
        lines: lines(),
      }),
    'Sahkan Penerimaan',
  );
  addLine();
  document.querySelector('[name=supplier]').required = !coffee;
  document.querySelector('[name=source]').onchange = (ev) =>
    (document.querySelector('[name=supplier]').required = ev.target.value === 'Vendor');
}
