// components/line-items.js
import { btn } from './ui.js';
import { get, pname } from '../core/data.js';
import { e, qval, units } from '../core/format.js';
import { html } from '../core/html.js';
import { state } from '../core/state.js';
export let lineType = '';
export let lineOptions = [];
export function lineSection(type) {
  lineType = type;
  return html`<div class="line-title">
      <h3>${type === 'input' ? 'Batch bahan' : 'Rincian barang'}</h3>
      ${btn('+ Baris', 'add-line', '', 'tiny')}
    </div>
    <div class="table-wrap">
      <table class="line-table">
        <thead>
          <tr>
            <th>${type === 'input' ? 'Batch' : 'Barang'}</th>
            <th class="qty-col">Qty</th>
            <th class="price-col">
              ${type === 'sale'
                ? 'Harga / satuan'
                : type === 'input'
                  ? 'Satuan'
                  : 'Total biaya (Rp)'}
            </th>
            ${type === 'sale' ? '<th class="qty-col">Diskon (Rp)</th>' : ''}
            <th class="remove-col"></th>
          </tr>
        </thead>
        <tbody id="lines"></tbody>
      </table>
    </div>
    <p class="footer-note">
      Kuantitas mengikuti satuan produk (kg atau pcs).
      ${type === 'receive' || type === 'output'
        ? 'Biaya adalah total untuk seluruh kuantitas pada baris, bukan harga per kg.'
        : ''}
    </p>`;
}
export function addLine(type = lineType) {
  const id = Date.now() + Math.random();
  let options =
    type === 'input'
      ? state.data.batches.map((b) => [
          b.id,
          `${b.number} · ${pname(b.product)} (${get('products', b.product).unit})`,
        ])
      : state.data.products
          .filter((p) => p.active && (type !== 'sale' || p.sell))
          .map((p) => [p.id, p.name + (p.sku ? ' · ' + p.sku : '') + ' · ' + p.unit]);
  const tr = document.createElement('tr');
  tr.innerHTML = html`<td>
      <select data-field="${type === 'input' ? 'batch' : 'product'}" ${type !== 'input' ? 'data-create-type="products"' : ''} ${type === 'sale' ? 'data-create-sale="true"' : ''} required>
        <option value="">Pilih…</option>
        ${options.map(([v, t]) => html`<option value="${v}">${e(t)}</option>`).join('')}
      </select>
    </td>
    <td>
      <input data-field="qty" type="number" min="0.001" step="any" required placeholder="0" />
    </td>
    <td>
      ${type === 'input'
        ? '<span class="row-unit muted">kg / pcs</span>'
        : html`<input
            data-field="${type === 'sale' ? 'price' : 'cost'}"
            type="number"
            min="0"
            step="1"
            required
            value="0"
          />`}
    </td>
    ${type === 'sale'
      ? '<td><input data-field="discount" type="number" min="0" step="1" value="0"></td>'
      : ''}
    <td>${btn('×', 'remove-line', '', 'quiet')}</td>`;
  document.querySelector('#lines').append(tr);
  tr.querySelector('select').onchange = (ev) => {
    const p =
      type === 'input'
        ? get('products', get('batches', ev.target.value).product)
        : get('products', ev.target.value);
    if (type === 'sale') tr.querySelector('[data-field=price]').value = p.price || 0;
    if (type === 'input') tr.querySelector('.row-unit').textContent = p.unit || '';
  };
}
export function lines() {
  return [...document.querySelectorAll('#lines tr')].map((tr) =>
    Object.fromEntries(
      [...tr.querySelectorAll('[data-field]')].map((el) => [el.dataset.field, el.value]),
    ),
  );
}
export function dynamicQtyRows(items, mode = 'qty') {
  return html`<div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Barang / batch</th>
          <th>Jumlah acuan</th>
          <th>Qty ${mode === 'opname' ? 'fisik' : ''}</th>
          ${mode === 'opname' ? '<th>Alasan selisih</th>' : ''}
        </tr>
      </thead>
      <tbody id="qty-lines">
        ${items
          .map((x) => {
            const b = get('batches', x.batch),
              p = get('products', b.product);
            return html`<tr data-row="${x.id}">
              <td>
                ${e(p.name)}<span class="sub"
                  >${e(b.number)}${x.bucket ? ' · ' + e(x.bucket) : ''}</span
                >
              </td>
              <td>${units(x.max, p)}</td>
              <td>
                <input
                  class="qty-input"
                  type="number"
                  min="0"
                  step="${p.unit === 'kg' ? '0.001' : '1'}"
                  ${mode === 'opname' ? '' : 'max="' + qval(x.max, p) + '"'}
                  value="${mode === 'opname' ? '' : qval(x.max, p)}"
                  required
                />
              </td>
              ${mode === 'opname'
                ? '<td><input class="reason-input" placeholder="Jika ada selisih"></td>'
                : ''}
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  </div>`;
}
export function qtyRows() {
  return [...document.querySelectorAll('#qty-lines tr')].map((tr) => ({
    id: tr.dataset.row,
    qty: tr.querySelector('.qty-input').value,
    reason: tr.querySelector('.reason-input')?.value || '',
  }));
}
