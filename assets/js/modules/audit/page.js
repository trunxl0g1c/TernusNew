import { header, toolbar } from '../../components/page.js';
import { table, labels } from '../../components/ui.js';
import { e, num, rup } from '../../core/format.js';
import { state } from '../../core/state.js';
import { allowed } from '../../core/permissions.js';

export const auditFilters = { user: '', group: '', from: '', until: '', record: '', page: 1 };
const groups = { master: 'Data master', stock: 'Stok & produksi', sales: 'Penjualan', money: 'Tagihan & pembayaran', assets: 'Aset', settings: 'Akun & pengaturan', access: 'Akses & backup' };
const entities = { products: 'Barang', customers: 'Pelanggan', suppliers: 'Vendor', users: 'Pengguna', locations: 'Lokasi', terms: 'Kamus SKU', batches: 'Batch', ledger: 'Pergerakan stok', receipts: 'Penerimaan', productions: 'Produksi', transfers: 'Transfer', quotes: 'Penawaran', orders: 'Order', shipments: 'Pengiriman', invoices: 'Invoice', payments: 'Pembayaran', credits: 'Nota kredit', refunds: 'Refund', returns: 'Retur', stocktakes: 'Stok opname', assets: 'Aset', asset_events: 'Aktivitas aset', settings: 'Pengaturan' };
const operations = {
  'database.migrate': 'Migrasi database',
  'master.save': 'Simpan data master', 'master.bulk': 'Arsip / aktifkan / hapus master', 'user.save': 'Simpan pengguna',
  settings: 'Ubah pengaturan', 'business.settings': 'Ubah profil / modul usaha', receive: 'Terima barang',
  'production.start': 'Mulai produksi', 'production.complete': 'Selesaikan produksi', 'transfer.send': 'Kirim transfer', 'transfer.receive': 'Terima transfer',
  'quote.create': 'Buat penawaran', 'quote.accept': 'Terima penawaran', 'quote.convert': 'Konversi penawaran',
  'order.create': 'Buat order', 'order.confirm': 'Konfirmasi order', 'order.cancel': 'Batalkan order', ship: 'Kirim barang',
  'invoice.create': 'Buat invoice', 'invoice.issue': 'Terbitkan invoice', pay: 'Catat pembayaran', credit: 'Catat nota kredit', refund: 'Catat refund',
  return: 'Terima retur', 'return.release': 'Loloskan inspeksi retur', 'opname.start': 'Mulai opname', 'opname.submit': 'Ajukan hitungan opname',
  'opname.approve': 'Setujui opname', 'opname.cancel': 'Batalkan opname', 'asset.create': 'Tambah aset', 'asset.event': 'Catat aktivitas aset',
  'auth.login': 'Masuk aplikasi', 'auth.logout': 'Keluar aplikasi', 'backup.export': 'Ekspor backup', setup: 'Instalasi awal',
};
const fields = {
  name: 'Nama', sku: 'SKU', unit: 'Satuan', price: 'Harga jual', cost: 'Biaya / harga dasar', stage: 'Tahap / kategori', minimum: 'Stok minimum (satuan internal)',
  net_g: 'Berat bersih (gram)', sell: 'Dijual', process: 'Diproses', active: 'Aktif', email: 'Email', role: 'Peran', password_changed: 'Password',
  phone: 'Telepon', address: 'Alamat', kind: 'Jenis', code: 'Kode', number: 'Nomor', date: 'Tanggal transaksi', time: 'Waktu',
  status: 'Status', product: 'Barang', batch: 'Batch', location: 'Lokasi', from: 'Asal', to: 'Tujuan', customer: 'Pelanggan', supplier: 'Vendor',
  customer_name: 'Nama pelanggan', by: 'Pelaku', by_name: 'Nama pelaku', document: 'Dokumen', document_id: 'ID dokumen',
  qty: 'Jumlah', initial_qty: 'Jumlah awal', received: 'Diterima', remaining: 'Sisa', system: 'Hitungan sistem', physical: 'Hitungan fisik',
  lines: 'Rincian barang', inputs: 'Bahan masuk', outputs: 'Hasil produksi', parents: 'Batch asal', allocations: 'Reservasi stok', bucket: 'Posisi stok',
  source: 'Sumber', pending: 'Menunggu hasil', notes: 'Catatan', note: 'Catatan', reason: 'Alasan', amount: 'Nominal', total: 'Total',
  paid: 'Dibayar', outstanding: 'Sisa tagihan', credit: 'Total nota kredit', refund: 'Total refund', refundable: 'Dana yang dapat direfund', stock_balance: 'Saldo batch di lokasi / posisi ini', invoice: 'Invoice', order: 'Order', shipment: 'Pengiriman', due: 'Jatuh tempo',
  bank: 'Bank', company: 'Nama usaha', closed_until: 'Tutup buku sampai', business: 'Profil & modul usaha', profile: 'Profil',
  modules: 'Modul aktif', stages: 'Tahap / kategori', processes: 'Proses produksi', revision: 'Versi pengaturan', loss: 'Susut (gram)',
};
const refTypes = { product: 'products', batch: 'batches', location: 'locations', from: 'locations', to: 'locations', customer: 'customers', supplier: 'suppliers', invoice: 'invoices', order: 'orders', shipment: 'shipments', by: 'users' };
const quantityKeys = ['qty', 'initial_qty', 'received', 'remaining', 'system', 'physical', 'stock_balance'];
export const operationLabel = (op) => operations[op] || op;
export function auditGroup(op) {
  if (op.startsWith('master.')) return 'master';
  if (['receive', 'return', 'return.release'].includes(op) || /^(production|transfer|opname)\./.test(op)) return 'stock';
  if (op === 'ship' || /^(quote|order)\./.test(op)) return 'sales';
  if (['pay', 'credit', 'refund'].includes(op) || op.startsWith('invoice.')) return 'money';
  if (op.startsWith('asset.')) return 'assets';
  if (['settings', 'business.settings', 'user.save', 'database.migrate'].includes(op)) return 'settings';
  return 'access';
}
export function auditTime(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value || '—') : d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' }) + ' WIB';
}
export function auditDay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const part = (name) => parts.find((p) => p.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
const userKey = (r) => r.user_id || 'legacy:' + r.user;
const reference = (type, id) => (state.data[type] || []).find((r) => r.id === id);
const unitFor = (context) => context.unit || reference('products', context.product || reference('batches', context.batch)?.product)?.unit;
export function valueText(value, key = '', context = {}) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (Array.isArray(value)) return value.length ? value.map((v, i) => `${i + 1}. ${valueText(v, '', context)}`).join('\n') : 'Kosong';
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${fieldLabel(k)}: ${valueText(v, k, { ...context, ...value })}`).join('\n');
  if (refTypes[key]) {
    const r = reference(refTypes[key], value);
    if (r) return `${r.name || r.number || value} (${value})`;
  }
  if (key === 'status') return labels[value] || String(value);
  if (key === 'bucket') return ({ available: 'Layak jual', wip: 'Dalam proses', transit: 'Dalam perjalanan', quarantine: 'Karantina' })[value] || String(value);
  if (typeof value === 'number') {
    if (quantityKeys.includes(key)) {
      const unit = unitFor(context);
      return unit ? num(value / (unit === 'kg' ? 1000 : 1)) + ' ' + unit : num(value) + ' (satuan internal)';
    }
    if (['price', 'cost', 'amount', 'total', 'paid', 'outstanding', 'credit', 'refund', 'refundable'].includes(key)) return rup(value);
    return num(value);
  }
  if (key === 'profile') return state.data.business_catalog?.profiles?.[value]?.label || String(value);
  return String(value);
}
const fieldLabel = (key) => fields[key] || state.data.business_catalog?.modules?.[key]?.label || key.replaceAll('_', ' ');
export function matchingAudit() {
  const query = state.searchQuery.toLowerCase().trim();
  return [...(state.data.audit || [])].reverse().filter((r) => {
    const day = auditDay(r.time);
    return (!auditFilters.user || userKey(r) === auditFilters.user) &&
      (!auditFilters.group || auditGroup(r.op) === auditFilters.group) &&
      (!auditFilters.from || day >= auditFilters.from) && (!auditFilters.until || (day && day <= auditFilters.until)) &&
      (!auditFilters.record || r.document === auditFilters.record || (r.changes || []).some((c) => c.id === auditFilters.record || JSON.stringify(c.fields).includes(auditFilters.record))) &&
      (!query || (JSON.stringify(r) + operationLabel(r.op) + groups[auditGroup(r.op)]).toLowerCase().includes(query));
  });
}
const link = (page, title) => allowed(page) ? `<a class="link" href="#${page}">${e(title)}</a>` : e(title);
function correctionHelp(r) {
  const group = auditGroup(r.op);
  if (group === 'master') return 'Nama, harga, dan kontak: gunakan Quick Edit / Edit Detail pada data terkait. Penghapusan master hanya berlaku untuk data yang belum dipakai transaksi.';
  if (group === 'stock') return `Selisih stok fisik layak jual: periksa ${link('stocktakes', 'Stok Opname')} dan minta persetujuan owner. Barang kembali dari pelanggan: gunakan ${link('returns', 'Retur')}. Periksa juga WIP, transit, dan reservasi; opname tidak membatalkan transaksi asal.`;
  if (group === 'sales') return `Order yang masih memenuhi syarat dapat dibatalkan melalui ${link('orders', 'Order')}. Barang sudah dikirim: periksa ${link('returns', 'Retur')}. Pembatalan tetap mengikuti validasi transaksi.`;
  if (group === 'money') return `Pengurangan tagihan menggunakan nota kredit, dan pengembalian dana menggunakan refund melalui ${link('invoices', 'Invoice & Piutang')}, sesuai transaksi sebenarnya. Salah input pembayaran belum memiliki pembatalan langsung; nota kredit bukan pembatalan pembayaran.`;
  if (group === 'settings') return `Perbaiki melalui menu ${link(r.op === 'user.save' ? 'users' : 'settings', r.op === 'user.save' ? 'Pengguna' : 'Pengaturan')} sesuai hak akses.`;
  if (group === 'assets') return `Catat perubahan kondisi atau penanggung jawab melalui ${link('assets', 'Inventaris Kantor')}.`;
  return 'Aktivitas akses dan backup merupakan catatan kejadian; tidak mengubah saldo stok.';
}
function details(r) {
  if (r.schema !== 2) return '<p class="muted">Log lama: detail sebelum–sesudah belum direkam. Detail ini tidak dapat dibuat ulang dari data sekarang.</p>';
  const changes = r.changes || [];
  return (changes.length ? changes.map((c) => `<section class="audit-change"><h4>${e(entities[c.entity] || c.entity)} · ${e(c.label)} <span class="badge">${e(({ created: 'Ditambahkan', updated: 'Diubah', deleted: 'Dihapus' })[c.kind] || c.kind)}</span></h4>${table(['Kolom', 'Sebelum', 'Sesudah'], c.fields.map((f) => [e(fieldLabel(f.key)), `<span class="audit-value">${e(valueText(f.before, f.key, c.context))}</span>`, `<span class="audit-value">${e(valueText(f.after, f.key, c.context))}</span>`]))}</section>`).join('') : '<p class="muted">Tidak ada perubahan nilai data bisnis pada aktivitas ini.</p>') + `<p class="audit-help">${correctionHelp(r)}</p>`;
}
export function auditPage() {
  const rows = matchingAudit();
  const size = 25, pages = Math.max(1, Math.ceil(rows.length / size));
  auditFilters.page = Math.max(1, Math.min(pages, auditFilters.page));
  const signature = JSON.stringify([state.searchQuery, auditFilters.user, auditFilters.group, auditFilters.from, auditFilters.until, auditFilters.record]);
  if (signature !== lastFilter) { auditFilters.page = 1; lastFilter = signature; }
  const users = [...new Map([...(state.data.audit || [])].reverse().map((r) => [userKey(r), r.user])).entries()];
  const select = (key, title, options) => `<label>${title}<select data-audit-filter="${key}"><option value="">Semua</option>${options.map(([v, label]) => `<option value="${e(v)}" ${auditFilters[key] === v ? 'selected' : ''}>${e(label)}</option>`).join('')}</select></label>`;
  state.exportHeads = ['Waktu WIB', 'Pengguna', 'ID pengguna', 'Peran', 'Aktivitas', 'Sumber', 'ID dokumen', 'Ringkasan', 'Data terkait', 'Kolom', 'Sebelum', 'Sesudah'];
  state.exportRows = rows.flatMap((r) => {
    const base = [auditTime(r.time), r.user, r.user_id || '', r.role || '', operationLabel(r.op), r.source || 'legacy', r.document || '', r.summary];
    const changed = (r.changes || []).flatMap((c) => c.fields.map((f) => [...base, `${entities[c.entity] || c.entity}: ${c.label}`, fieldLabel(f.key), valueText(f.before, f.key, c.context), valueText(f.after, f.key, c.context)]));
    return changed.length ? changed : [[...base, '', '', '', '']];
  });
  return header('Riwayat Aktivitas', 'Otomatis mencatat siapa, kapan, dan perubahan yang disimpan. Waktu ditampilkan dalam WIB.') +
    '<div class="notice">Log tidak perlu diisi manual dan tidak dihapus saat koreksi. Saldo stok tetap dihitung dari mutasi stok yang sah. Setiap staf sebaiknya memakai akun sendiri.</div>' +
    `<section class="panel">${toolbar()}<div class="audit-filters">${select('user', 'Pengguna', users)}${select('group', 'Bagian aplikasi', Object.entries(groups))}<label>Dari tanggal<input type="date" data-audit-filter="from" value="${e(auditFilters.from)}"></label><label>Sampai tanggal<input type="date" data-audit-filter="until" value="${e(auditFilters.until)}"></label><button class="btn tiny" data-audit-reset>Hapus filter</button></div>` +
    (auditFilters.record ? `<p class="audit-scope">Riwayat untuk data ID: ${e(auditFilters.record)}. Klik Hapus filter untuk melihat semua aktivitas.</p>` : '') +
    (auditFilters.from && auditFilters.until && auditFilters.from > auditFilters.until ? '<p class="audit-scope" role="alert">Tanggal awal harus sebelum atau sama dengan tanggal akhir.</p>' : '') +
    (rows.length ? `<div class="audit-list">${rows.slice((auditFilters.page - 1) * size, auditFilters.page * size).map((r) => `<details class="audit-entry"><summary><span><strong>${e(operationLabel(r.op))}</strong><span class="sub">${e(r.summary)}</span></span><span>${e(r.user)}${r.role ? `<span class="sub">${e(r.role)}</span>` : ''}</span><span>${e(auditTime(r.time))}<span class="sub">${r.source === 'quick-edit' ? 'Quick Edit' : r.source === 'form' ? 'Form / tindakan' : r.schema === 2 ? 'Sistem' : 'Log lama'} · Buka detail</span></span></summary><div class="audit-detail"><p class="small muted">ID log: ${e(r.id)}${r.document ? ' · ID dokumen: ' + e(r.document) : ''}</p>${details(r)}</div></details>`).join('')}</div>` : '<div class="empty"><strong>Tidak ada aktivitas yang cocok</strong><span>Ubah filter atau lakukan transaksi untuk mulai merekam riwayat baru.</span></div>') +
    `<div class="pagination audit-pagination"><span>${rows.length} aktivitas · Halaman ${auditFilters.page} dari ${pages}. Ekspor CSV mencakup semua hasil filter.</span><button class="btn tiny" data-audit-page="${auditFilters.page - 1}" ${auditFilters.page <= 1 ? 'disabled' : ''}>Sebelumnya</button><button class="btn tiny" data-audit-page="${auditFilters.page + 1}" ${auditFilters.page >= pages ? 'disabled' : ''}>Berikutnya</button></div></section>`;
}
let lastFilter = '';
export function resetAuditFilters() {
  Object.assign(auditFilters, { user: '', group: '', from: '', until: '', record: '', page: 1 });
  state.searchQuery = '';
}
export function bindAuditPage(renderPage) {
  if (state.currentPage !== 'audit') return;
  document.querySelectorAll('[data-audit-filter]').forEach((el) => { el.onchange = () => { auditFilters[el.dataset.auditFilter] = el.value; auditFilters.page = 1; renderPage(); }; });
  document.querySelectorAll('[data-audit-page]').forEach((el) => { el.onclick = () => { auditFilters.page = Number(el.dataset.auditPage); renderPage(); }; });
  const reset = document.querySelector('[data-audit-reset]');
  if (reset) reset.onclick = () => { resetAuditFilters(); renderPage(); };
}
export const auditActions = {
  'audit-record': async (_act, id) => {
    if (!allowed('audit')) throw Error('Riwayat aktivitas hanya untuk owner dan admin.');
    resetAuditFilters();
    auditFilters.record = id;
    location.hash = 'audit';
  },
};
