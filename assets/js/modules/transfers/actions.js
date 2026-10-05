// modules/transfers/actions.js
import { field } from '../../components/fields.js';
import { dynamicQtyRows, qtyRows } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { mutate } from '../../core/api.js';
import { get } from '../../core/data.js';
import { dateNow } from '../../core/format.js';
import { transferSend } from './form.js';
export async function handleTransferSend(act, id, button) {
  transferSend();
  return;
}
export async function handleTransferReceive(act, id, button) {
  const d = get('transfers', id);
  openForm(
    'Terima ' + d.number,
    field('date', 'Tanggal diterima', 'date', dateNow(), true) +
      dynamicQtyRows(
        d.lines.map((l) => ({
          ...l,
          max: l.qty - l.received,
        })),
      ),
    (a) =>
      mutate('transfer.receive', {
        ...a,
        id,
        lines: qtyRows(),
      }),
    'Terima',
  );
  return;
}
export const transfersActions = {
  'transfer-send': handleTransferSend,
  'transfer-receive': handleTransferReceive,
};
