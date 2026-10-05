// modules/shipping/actions.js
import { field } from '../../components/fields.js';
import { dynamicQtyRows, qtyRows } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { mutate } from '../../core/api.js';
import { get } from '../../core/data.js';
import { dateNow } from '../../core/format.js';
export async function handleShip(act, id, button) {
  const o = get('orders', id);
  openForm(
    'Pengiriman ' + o.number,
    field('date', 'Tanggal kirim', 'date', dateNow(), true) +
      dynamicQtyRows(
        o.allocations
          .filter((l) => l.remaining)
          .map((l) => ({
            ...l,
            max: l.remaining,
          })),
      ),
    (a) =>
      mutate('ship', {
        ...a,
        id,
        lines: qtyRows(),
      }),
    'Sahkan Pengiriman',
  );
  return;
}
export const shippingActions = {
  ship: handleShip,
};
