// modules/payments/actions.js
import { field, select } from '../../components/fields.js';
import { openForm, showDetail } from '../../components/modal.js';
import { notice, table } from '../../components/ui.js';
import { mutate } from '../../core/api.js';
import { get } from '../../core/data.js';
import { dateNow, dt, e, rup } from '../../core/format.js';
import { html } from '../../core/html.js';
import { state } from '../../core/state.js';
export async function handlePay(act, id, button) {
  const v = get('invoices', id),
    max = act === 'pay' ? v.outstanding : act === 'refund' ? v.refundable : v.total - v.credit;
  openForm(
    act === 'pay'
      ? 'Catat dan verifikasi pembayaran'
      : act === 'credit'
        ? 'Sahkan nota kredit'
        : 'Catat refund',
    html`${notice(v.number + ' · Maksimal ' + rup(max))}
      <div class="form-grid">
        ${field('date', 'Tanggal', 'date', dateNow(), true)}${field(
          'amount',
          'Nominal rupiah',
          'number',
          max,
          true,
        )}${select(
          'method',
          'Metode',
          [
            ['Transfer', 'Transfer'],
            ['Tunai', 'Tunai'],
          ],
          'Transfer',
        )}${field(
          'note',
          act === 'credit' ? 'Alasan kredit' : 'Referensi bank / bukti pembayaran',
          'text',
          '',
          true,
        )}
      </div>`,
    (a) =>
      mutate(act, {
        ...a,
        invoice: id,
      }),
    'Sahkan',
  );
  return;
}
export async function handleInvoiceHistory(act, id, button) {
  const v = get('invoices', id);
  showDetail(
    'Riwayat ' + v.number,
    table(
      ['Jenis', 'Tanggal', 'Nominal', 'Catatan'],
      [
        ...state.data.payments
          .filter((x) => x.invoice === id)
          .map((x) => ['Pembayaran', dt(x.date), rup(x.amount), e(x.note)]),
        ...state.data.credits
          .filter((x) => x.invoice === id)
          .map((x) => ['Nota kredit', dt(x.date), rup(x.amount), e(x.note)]),
        ...state.data.refunds
          .filter((x) => x.invoice === id)
          .map((x) => ['Refund', dt(x.date), rup(x.amount), e(x.note)]),
      ],
    ),
  );
  return;
}
export const paymentsActions = {
  pay: handlePay,
  credit: handlePay,
  refund: handlePay,
  'invoice-history': handleInvoiceHistory,
};
