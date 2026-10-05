// modules/stocktakes/actions.js
import { select } from '../../components/fields.js';
import { dynamicQtyRows, qtyRows } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { notice } from '../../components/ui.js';
import { mutate } from '../../core/api.js';
import { get, opts } from '../../core/data.js';
export async function handleOpnameApprove(act, id, button) {
  const ops = {
    'opname-approve': 'opname.approve',
    'opname-cancel': 'opname.cancel',
  };
  if (!confirm('Lanjutkan ' + button.textContent + '? Perubahan akan langsung disimpan.')) return;
  await mutate(ops[act], {
    id,
  });
  return;
}
export async function handleOpnameStart(act, id, button) {
  openForm(
    'Mulai stok opname',
    notice('Lokasi akan dikunci untuk mutasi sampai owner menyetujui atau sesi dibatalkan.') +
      select('location', 'Lokasi', opts('locations')),
    (a) => mutate('opname.start', a),
    'Mulai Opname',
  );
  return;
}
export async function handleOpnameCount(act, id, button) {
  const d = get('stocktakes', id);
  openForm(
    'Hasil fisik ' + d.number,
    notice('Isi semua baris. Kosong berbeda dengan nol. Alasan wajib untuk setiap selisih.') +
      dynamicQtyRows(
        d.lines.map((l) => ({
          ...l,
          max: l.system,
        })),
        'opname',
      ),
    (a) =>
      mutate('opname.submit', {
        id,
        lines: qtyRows(),
      }),
    'Ajukan ke Owner',
  );
  return;
}
export const stocktakesActions = {
  'opname-approve': handleOpnameApprove,
  'opname-cancel': handleOpnameApprove,
  'opname-start': handleOpnameStart,
  'opname-count': handleOpnameCount,
};
