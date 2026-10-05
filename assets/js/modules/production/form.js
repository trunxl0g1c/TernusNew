// modules/production/form.js
import { area, field, select } from '../../components/fields.js';
import { addLine, lineSection, lines } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { notice } from '../../components/ui.js';
import { mutate } from '../../core/api.js';
import { get, opts } from '../../core/data.js';
import { dateNow, num } from '../../core/format.js';
import { html } from '../../core/html.js';
import { productionKinds } from '../../core/business.js';
export function productionStart() {
  openForm(
    'Mulai produksi',
    html`<div class="form-grid">
        ${field('date', 'Tanggal mulai', 'date', dateNow(), true)}${select(
          'location',
          'Lokasi proses',
          opts('locations'),
        )}${select(
          'kind',
          'Jenis proses',
          productionKinds().map((x) => [x, x]),
          productionKinds().includes('Roasting') ? 'Roasting' : productionKinds()[0] || '',
        )}
      </div>
      ${notice(
        'Bahan dari beberapa batch dapat digabung. Saat dimulai, bahan dipindah ke WIP dan tidak tersedia untuk dijual.',
      )}${lineSection('input')}`,
    (a) =>
      mutate('production.start', {
        ...a,
        inputs: lines(),
      }),
    'Mulai Proses',
  );
  addLine();
}
export function productionComplete(id) {
  const d = get('productions', id);
  openForm(
    'Selesaikan ' + d.number,
    html`${notice(
        'Biaya bahan Rp' +
          num(d.cost) +
          '. Total biaya output harus sama dengan biaya bahan + biaya proses tambahan. Isi berat/jumlah hasil aktual.',
      )}
      <div class="form-grid">
        ${field('date', 'Tanggal selesai', 'date', dateNow(), true)}${field(
          'extra',
          'Biaya proses tambahan (Rp)',
          'number',
          0,
          true,
        )}${area('note', 'Catatan proses / alasan hasil melebihi input')}
      </div>
      ${lineSection('output')}`,
    (a) =>
      mutate('production.complete', {
        ...a,
        id,
        outputs: lines(),
      }),
    'Selesaikan Produksi',
  );
  addLine();
  document.querySelector('#lines [data-field=cost]').value = d.cost;
}
