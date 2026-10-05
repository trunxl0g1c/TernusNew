// modules/sales/form.js
import { field, select } from '../../components/fields.js';
import { addLine, lineSection, lines } from '../../components/line-items.js';
import { openForm } from '../../components/modal.js';
import { notice } from '../../components/ui.js';
import { mutate } from '../../core/api.js';
import { opts } from '../../core/data.js';
import { dateNow } from '../../core/format.js';
import { html } from '../../core/html.js';
export function saleForm(quote) {
  openForm(
    quote ? 'Buat quotation' : 'Buat order',
    html`<div class="form-grid">
        ${field('date', 'Tanggal', 'date', dateNow(), true)}${select(
          'customer',
          'Pelanggan',
          opts('customers'),
        )}${select('location', 'Lokasi pemenuhan', opts('locations'))}${quote
          ? field('valid_until', 'Berlaku sampai', 'date', dateNow(), true)
          : ''}${field('shipping', 'Ongkir (Rp)', 'number', 0, true)}
      </div>
      ${lineSection('sale')}${notice(
        'Versi ini memakai rupiah dan harga tanpa perhitungan pajak otomatis. Quotation/order draft belum mengubah stok.',
      )}`,
    (a) =>
      mutate(quote ? 'quote.create' : 'order.create', {
        ...a,
        lines: lines(),
      }),
    'Simpan Draft',
  );
  addLine();
}
