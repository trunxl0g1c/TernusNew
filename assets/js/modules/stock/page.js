// modules/stock/page.js
import { showDetail } from '../../components/modal.js';
import { filtered, header, toolbar } from '../../components/page.js';
import { table } from '../../components/ui.js';
import { bname, get, lname, pname } from '../../core/data.js';
import { dt, e, qval, units } from '../../core/format.js';
import { html } from '../../core/html.js';
import { state } from '../../core/state.js';
export function stockPage() {
  const rows = filtered(
    state.data.stock
      .filter((x) => !state.locationFilter || x.location === state.locationFilter)
      .map((r) => ({
        ...r,
        name: pname(r.product),
        batch_no: bname(r.batch),
        location_name: lname(r.location),
      })),
  );
  state.exportHeads = [
    'Barang',
    'Batch',
    'Lokasi',
    'Satuan',
    'Fisik layak',
    'Reservasi',
    'Tersedia',
    'WIP',
    'Transit',
    'Karantina',
  ];
  state.exportRows = rows.map((r) => {
    const p = get('products', r.product);
    return [
      r.name,
      r.batch_no,
      r.location_name,
      p.unit,
      ...['available', 'reserved', 'free', 'wip', 'transit', 'quarantine'].map((k) =>
        qval(r[k], p),
      ),
    ];
  });
  return (
    header(
      'Stok & penelusuran batch',
      'Saldo dihitung dari transaksi yang disahkan, bukan angka yang diedit manual.',
    ) +
    html`<section class="panel">
      ${toolbar(
        html`<select id="locfilter" class="max-w-[180px]">
          <option value="">Semua lokasi</option>
          ${state.data.locations
            .map(
              (l) =>
                html`<option value="${l.id}" ${state.locationFilter === l.id ? 'selected' : ''}>
                  ${e(l.name)}
                </option>`,
            )
            .join('')}
        </select>`,
      )}${table(
        [
          'Barang / batch',
          'Lokasi',
          'Fisik layak',
          'Reservasi',
          'Tersedia',
          'WIP',
          'Transit',
          'Karantina',
        ],
        rows.map((r) => {
          const p = get('products', r.product);
          return [
            html`<button class="link" data-act="batch" data-id="${r.batch}">${e(r.name)}</button
              ><span class="sub">${e(r.batch_no)}</span>`,
            e(r.location_name),
            ...['available', 'reserved', 'free', 'wip', 'transit', 'quarantine'].map((k) =>
              units(r[k], p),
            ),
          ];
        }),
      )}
    </section>`
  );
}
export function batchDetail(id) {
  function node(bid, seen = new Set()) {
    if (seen.has(bid)) return '';
    seen.add(bid);
    const b = get('batches', bid);
    return html`<div class="trace-node">
      <strong>${e(b.number)}</strong> · ${e(pname(b.product))}
      <div class="small muted">${dt(b.date)} · ${e(b.source || '')}</div>
      ${(b.parents || []).map((x) => node(x.batch, new Set(seen))).join('')}
    </div>`;
  }
  const b = get('batches', id);
  showDetail(
    'Penelusuran batch',
    node(id) +
      table(
        ['Tanggal', 'Dokumen', 'Lokasi', 'Bucket', 'Mutasi'],
        state.data.ledger
          .filter((x) => x.batch === id)
          .map((x) => [
            dt(x.date),
            e(x.document),
            e(lname(x.location)),
            e(x.bucket),
            units(x.qty, get('products', x.product)),
          ]),
      ),
  );
}
