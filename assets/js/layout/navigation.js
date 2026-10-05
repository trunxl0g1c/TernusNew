// layout/navigation.js
export const nav = [
  [
    'RINGKASAN',
    [
      ['dashboard', '◫', 'Dashboard'],
      ['stock', '▦', 'Stok & Batch'],
    ],
  ],
  [
    'INVENTORY PRODUK',
    [
      ['receipts', '↓', 'Penerimaan'],
      ['productions', '↻', 'Produksi'],
      ['transfers', '⇄', 'Transfer Lokasi'],
      ['stocktakes', '✓', 'Stok Opname'],
    ],
  ],
  [
    'PENJUALAN',
    [
      ['quotes', '▤', 'Quotation'],
      ['orders', '▣', 'Order'],
      ['shipments', '↗', 'Pengiriman'],
      ['invoices', '▧', 'Invoice & Piutang'],
      ['payments', '◉', 'Pembayaran'],
      ['returns', '↩', 'Retur'],
    ],
  ],
  [
    'DATA & PENGATURAN',
    [
      ['products', '◇', 'Data Barang'],
      ['customers', '○', 'Pelanggan'],
      ['suppliers', '♧', 'Vendor'],
      ['terms', '⌗', 'Kamus SKU'],
      ['locations', '⌂', 'Lokasi'],
      ['assets', '▥', 'Inventaris Kantor'],
      ['users', '◎', 'Pengguna'],
      ['audit', '≡', 'Riwayat Aktivitas'],
      ['settings', '⚙', 'Pengaturan'],
    ],
  ],
];
export const titles = Object.fromEntries(nav.flatMap((x) => x[1].map((y) => [y[0], y[2]])));
