// layout/record-registry.js
import { auditRow } from '../modules/audit/table.js';
import { invoicesRow } from '../modules/invoices/table.js';
import { assetsRow } from '../modules/office-assets/table.js';
import { paymentsRow } from '../modules/payments/table.js';
import { productionsRow } from '../modules/production/table.js';
import { receiptsRow } from '../modules/receiving/table.js';
import { returnsRow } from '../modules/returns/table.js';
import { ordersRow, quotesRow } from '../modules/sales/table.js';
import { shipmentsRow } from '../modules/shipping/table.js';
import { stocktakesRow } from '../modules/stocktakes/table.js';
import { transfersRow } from '../modules/transfers/table.js';
export const descriptors = {
  receipts: [
    'Penerimaan barang',
    'Terima barang dari sumber internal, vendor, atau saldo awal.',
    '+ Penerimaan',
    'receive',
  ],
  productions: [
    'Produksi & pengemasan',
    'Campur beberapa batch, catat hasil aktual dan biaya pengolahan.',
    '+ Mulai Produksi',
    'production-start',
  ],
  transfers: [
    'Transfer antarlokasi',
    'Pantau barang dari dikirim sampai diterima di lokasi tujuan.',
    '+ Kirim Transfer',
    'transfer-send',
  ],
  stocktakes: [
    'Stok opname',
    'Hitung fisik, ajukan selisih, dan dapatkan persetujuan owner.',
    '+ Mulai Opname',
    'opname-start',
  ],
  quotes: [
    'Quotation',
    'Penawaran pelanggan yang dapat diteruskan menjadi order dan invoice.',
    '+ Quotation',
    'sale-quote',
  ],
  orders: [
    'Order penjualan',
    'Konfirmasi order untuk mencadangkan stok sebelum pengiriman.',
    '+ Order',
    'sale-order',
  ],
  shipments: ['Pengiriman', 'Buat pengiriman melalui order yang sudah dikonfirmasi.', '', ''],
  invoices: [
    'Invoice & piutang',
    'Invoice menambah tagihan; pengiriman yang mengurangi stok.',
    '',
    '',
  ],
  payments: ['Pembayaran', 'Pembayaran, nota kredit, dan refund dicatat melalui invoice.', '', ''],
  returns: [
    'Retur penjualan',
    'Terima pengembalian ke karantina, lalu periksa sebelum dijual kembali.',
    '',
    '',
  ],
  assets: [
    'Inventaris kantor',
    'Kelola aset, penanggung jawab, peminjaman, dan perawatan.',
    '+ Aset',
    'asset-new',
  ],
  audit: ['Riwayat audit', 'Jejak tindakan pengguna untuk setiap perubahan data.', '', ''],
};
export const recordViews = {
  receipts: receiptsRow,
  productions: productionsRow,
  transfers: transfersRow,
  stocktakes: stocktakesRow,
  quotes: quotesRow,
  orders: ordersRow,
  shipments: shipmentsRow,
  invoices: invoicesRow,
  payments: paymentsRow,
  returns: returnsRow,
  assets: assetsRow,
  audit: auditRow,
};
