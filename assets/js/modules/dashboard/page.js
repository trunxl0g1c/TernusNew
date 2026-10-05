// modules/dashboard/page.js
import { header } from '../../components/page.js';
import { btn, empty, panel, stat, table } from '../../components/ui.js';
import { get } from '../../core/data.js';
import { dateNow, dt, e, num, rup } from '../../core/format.js';
import { html } from '../../core/html.js';
import { admin } from '../../core/permissions.js';
import { state } from '../../core/state.js';
import { businessConfig, moduleEnabled } from '../../core/business.js';
export function dashboard() {
  const issued = state.data.invoices.filter((i) => i.status === 'ISSUED');
  const outstanding = issued.reduce((n, i) => n + i.outstanding, 0),
    overdue = issued.filter((i) => i.outstanding && i.due < dateNow());
  const inProcess = state.data.productions.filter((p) => p.status === 'IN_PROGRESS').length;
  const totalSales = state.data.shipments.reduce(
    (n, x) => n + x.lines.reduce((a, l) => a + l.net, 0),
    0,
  );
  const recent = [...state.data.audit].reverse().slice(0, 6);
  return (
    header(
      'Operasional, dalam satu pandangan.',
      businessConfig().profile === 'coffee' ? 'Pantau perjalanan kopi dan kesehatan tagihan Anda.' : 'Pantau persediaan dan aktivitas usaha Anda.',
      html`<span class="badge">${dt(dateNow())}</span>`,
    ) +
    html`<div class="hero">
        <div>
          <h2>Setiap batch punya cerita.</h2>
          <p>
            Telusuri bahan dari sumbernya, kelola perpindahan antar lokasi, dan pastikan setiap
            penjualan tercatat.
          </p>
          <div class="actions mt-[15px]">
            ${admin()
              ? btn('+ Penerimaan', 'receive', '', 'primary')
              : btn('+ Order Baru', 'sale-order', '', 'primary')}${btn('Lihat stok', 'goto-stock')}
          </div>
        </div>
        <div class="hero-emblem">❧</div>
      </div>
      <div class="stats">
        ${stat(
          'Produk aktif',
          num(state.data.products.filter((p) => p.active).length),
          'Master barang siap digunakan',
          '◇',
        )}${moduleEnabled('shipping') ? stat(
          'Penjualan terkirim',
          rup(totalSales),
          'Akumulasi nilai barang sebelum retur',
          '↗',
        ) : ''}${moduleEnabled('invoicing') ? stat(
          'Outstanding invoice',
          rup(outstanding),
          overdue.length + ' invoice lewat jatuh tempo',
          '▧',
        ) : ''}${moduleEnabled('production') ? stat('Proses berjalan', num(inProcess), 'Batch yang sedang diolah', '↻') : ''}
      </div>
      <div class="grid2">
        ${panel(
          'Stok per lokasi',
          html`<div class="panel-body">
            <div class="metric-locations">
              ${state.data.locations
                .filter((l) => l.active)
                .map((l) => {
                  const rows = state.data.stock.filter((x) => x.location === l.id);
                  const kg =
                    rows
                      .filter((r) => get('products', r.product).unit === 'kg')
                      .reduce((n, r) => n + r.free, 0) / 1000;
                  const pcs = rows
                    .filter((r) => get('products', r.product).unit === 'pcs')
                    .reduce((n, r) => n + r.free, 0);
                  return html`<div class="location-card">
                    <span class="muted small">⌂ ${e(l.name)}</span
                    ><strong>${num(kg)} <small>kg</small></strong>
                    <div class="small muted">${num(pcs)} pcs tersedia</div>
                  </div>`;
                })
                .join('')}
            </div>
            <p class="footer-note">
              Stok tersedia sudah dikurangi reservasi. WIP, karantina, dan perjalanan ditampilkan
              pada halaman stok.
            </p>
          </div>`,
        )}${moduleEnabled('invoicing') ? panel(
          'Tagihan yang perlu perhatian',
          overdue.length
            ? table(
                ['Invoice', 'Pelanggan', 'Sisa'],
                overdue
                  .slice(0, 5)
                  .map((i) => [
                    btn(i.number, 'print-invoice', i.id, 'quiet tiny'),
                    e(i.customer_name),
                    rup(i.outstanding),
                  ]),
              )
            : empty(
                'Tidak ada tagihan lewat jatuh tempo',
                'Invoice dengan sisa tagihan akan muncul di sini.',
              ),
        ) : ''}
      </div>
      ${panel(
        'Aktivitas terbaru',
        recent.length
          ? table(
              ['Waktu', 'Pengguna', 'Aktivitas', 'Keterangan'],
              recent.map((x) => [dt(x.time), e(x.user), e(x.op), e(x.summary)]),
            )
          : empty(
              'Ruang kerja siap digunakan',
              'Mulai dengan memeriksa data barang, menambah vendor/pelanggan, lalu menerima stok.',
            ),
      )}`
  );
}
