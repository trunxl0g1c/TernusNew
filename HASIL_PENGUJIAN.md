# Perbaikan terbaru: migrasi tanpa array_is_list

Lihat `docs/FIX_MIGRASI_ARRAY_IS_LIST.md` untuk pengujian dengan fungsi native dinonaktifkan. Hasil berikut merupakan catatan revisi sebelumnya.

# Revisi terbaru: tambah master dari formulir

Lihat `docs/TAMBAH_LANGSUNG.md` untuk pengujian revisi ini. Hasil berikut berasal dari revisi sebelumnya.

# Revisi terbaru: dropdown pencarian

Lihat `docs/DROPDOWN_PENCARIAN.md` untuk hasil pengujian komponen, Chromium desktop/ponsel, dan batas pemeriksaan. Hasil database berikut berasal dari revisi sebelumnya.

# Hasil pengujian revisi database tabel terpisah

Dijalankan dengan PHP 8.3.6, MariaDB 10.11.14 dan Node.js 24 pada lingkungan Linux terpisah. Database operasional pengguna tidak diakses atau dimigrasikan dalam pengujian ini.

Lulus:

- Sintaks seluruh 49 file PHP.
- Sintaks/import 64 modul JavaScript, tanpa dependensi lokal hilang atau siklus.
- 33 pemeriksaan integrasi database: konversi data lengkap, akun/hash, login owner/sales dengan session, arsip tidak berubah, idempotensi, penulisan satu baris, rollback relasi dan transaksi parsial, pemasangan baru, retry migrasi, perlindungan bentrok tabel, restore dengan ID berbeda, rollback restore, penguncian dua koneksi.
- 31 pemeriksaan domain dengan penyimpanan dan pembacaan tabel setelah setiap operasi: penerimaan, produksi, HPP, transfer, order/reservasi, invoice, pengiriman, pembayaran/kredit/refund, retur, opname, aset, izin dan konflik versi.
- 31 pemeriksaan domain dalam memori, 103 pemeriksaan profil bisnis/modul, 23 pemeriksaan audit.
- Tes JavaScript quick edit enam master, profil bisnis/modul, audit serta panel migrasi. Tes panel memastikan konfirmasi backup, POST dengan CSRF, pemuatan ulang, dan status mode aktif. DOM/API disimulasikan, bukan browser nyata.

Batas: belum diuji langsung pada Windows/XAMPP pengguna, database operasional pengguna, atau beban produksi. Versi revisi ini belum diuji visual di browser; hasil UI otomatis tidak menggantikan pemeriksaan tersebut. Tidak ada klaim peningkatan kapasitas banyak pengguna atau jaminan seluruh kombinasi input sudah tercakup.

Cara mengulang: lihat `docs/MIGRASI_DATABASE.md` untuk tes PHP/database; jalankan `node scripts/check-modules.mjs` serta masing-masing berkas `tests/*_test.mjs` untuk JavaScript.
