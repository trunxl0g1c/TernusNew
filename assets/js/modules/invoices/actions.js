// modules/invoices/actions.js
import { field } from '../../components/fields.js';
import { openForm } from '../../components/modal.js';
import { notice } from '../../components/ui.js';
import { mutate } from '../../core/api.js';
import { dateNow } from '../../core/format.js';
import { html } from '../../core/html.js';
import { invoicePrint } from './print.js';
export async function handlePrintInvoice(act, id, button) {
  invoicePrint(id, act === 'print-quote');
  return;
}
export async function handleInvoiceCreate(act, id, button) {
  await mutate('invoice.create', {
    id,
  });
  location.hash = 'invoices';
  return;
}
export async function handleInvoiceIssue(act, id, button) {
  openForm(
    'Terbitkan invoice',
    html`<div class="form-grid">
        ${field('date', 'Tanggal terbit', 'date', dateNow(), true)}${field(
          'due',
          'Jatuh tempo',
          'date',
          dateNow(),
          true,
        )}
      </div>
      ${notice('Order harus dikonfirmasi. Invoice menambah tagihan tanpa mengubah stok.')}`,
    (a) =>
      mutate('invoice.issue', {
        ...a,
        id,
      }),
    'Terbitkan',
  );
  return;
}
export const invoicesActions = {
  'print-invoice': handlePrintInvoice,
  'print-quote': handlePrintInvoice,
  'invoice-create': handleInvoiceCreate,
  'invoice-issue': handleInvoiceIssue,
};
