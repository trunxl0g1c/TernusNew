import { html } from '../../core/html.js';
// modules/invoices/print.js
import { showDetail } from '../../components/modal.js';
import { labels, table } from '../../components/ui.js';
import { get } from '../../core/data.js';
import { dt, e, rup, units } from '../../core/format.js';
import { state } from '../../core/state.js';
export function invoicePrint(id, quote = false) {
  const r = get(quote ? 'quotes' : 'invoices', id),
    c = get('customers', r.customer),
    co = r.company || state.data.settings;
  const contentMarkup = html`<article class="print-sheet">
    <div class="print-meta">
      <div>
        <h1>${e(co.company)}</h1>
        <p>${e(co.address || '')}<br />${e(co.phone || '')}</p>
      </div>
      <div>
        <h2>${quote ? 'QUOTATION' : 'INVOICE'}</h2>
        <strong>${e(r.number)}</strong><br />${e(labels[r.status] || r.status)}<br />Tanggal:
        ${dt(r.date)}<br />${quote
          ? 'Berlaku sampai: ' + dt(r.valid_until)
          : 'Jatuh tempo: ' + dt(r.due)}
      </div>
    </div>
    <p>
      <strong>Kepada</strong><br />${e(r.customer_name)}<br />${e(r.address || c.address || '')}
    </p>
    ${table(
      ['Barang', 'Qty', 'Harga/satuan', 'Diskon', 'Jumlah'],
      r.lines.map((l) => [
        e(l.name) + '<span class="sub">' + e(l.sku) + '</span>',
        units(l.qty, {
          unit: l.unit,
        }),
        rup(l.price),
        rup(l.discount),
        rup(l.net),
      ]),
    )}
    <div class="print-total">
      <div><span>Subtotal</span><span>${rup(r.total - r.shipping)}</span></div>
      <div><span>Ongkir</span><span>${rup(r.shipping)}</span></div>
      <div class="grand"><span>Total</span><span>${rup(r.total)}</span></div>
      ${!quote
        ? html`<div><span>Pembayaran</span><span>${rup(r.paid)}</span></div>
            <div><span>Nota kredit</span><span>${rup(r.credit)}</span></div>
            <div><span>Sisa tagihan</span><span>${rup(r.outstanding)}</span></div>`
        : ''}
    </div>
    <p class="mt-[35px]">
      ${e(co.bank || 'Hubungi sales untuk informasi pembayaran.').replace(/\n/g, '<br>')}
    </p>
    <p class="small">
      Terima kasih atas kepercayaan Anda.<br />Dicetak ${new Date().toLocaleString('id-ID')}.
      ${r.status === 'DRAFT' ? 'DRAFT — belum merupakan tagihan terbit.' : ''}
    </p>
  </article>`;
  showDetail(quote ? 'Quotation' : 'Invoice', contentMarkup, true);
}
