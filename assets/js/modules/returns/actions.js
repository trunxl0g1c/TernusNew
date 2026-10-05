// modules/returns/actions.js
import { field, select } from '../../components/fields.js';
import { dynamicQtyRows, qtyRows } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { mutate } from '../../core/api.js';
import { get, opts } from '../../core/data.js';
import { dateNow } from '../../core/format.js';
import { html } from '../../core/html.js';
export async function handleReturnRelease(act, id, button) {
  const ops = {
    'return-release': 'return.release',
  };
  if (!confirm('Lanjutkan ' + button.textContent + '? Perubahan akan langsung disimpan.')) return;
  await mutate(ops[act], {
    id,
  });
  return;
}
export async function handleReturnNew(act, id, button) {
  const d = get('shipments', id);
  openForm(
    'Retur ' + d.number,
    html`<div class="form-grid">
        ${field('date', 'Tanggal diterima', 'date', dateNow(), true)}${select(
          'location',
          'Lokasi penerimaan',
          opts('locations'),
          d.location,
        )}${field('note', 'Alasan dan kondisi', 'text', '', true)}
      </div>
      ${dynamicQtyRows(
        d.lines
          .filter((l) => l.qty > l.returned)
          .map((l) => ({
            ...l,
            max: l.qty - l.returned,
          })),
      )}`,
    (a) =>
      mutate('return', {
        ...a,
        shipment: id,
        lines: qtyRows(),
      }),
    'Terima ke Karantina',
  );
  return;
}
export const returnsActions = {
  'return-release': handleReturnRelease,
  'return-new': handleReturnNew,
};
