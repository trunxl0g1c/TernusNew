# Migrasi TERNUS ke tabel terpisah

Revisi ini memindahkan akun, master, dokumen, rincian transaksi, mutasi stok, dan log dari satu JSON ke tabel InnoDB. Tidak perlu mengisi ulang akun atau saldo. Instalasi baru langsung memakai tabel terpisah; instalasi lama berpindah hanya setelah migrasi dijalankan.

## Pemasangan untuk pengguna lama

1. Minta semua pengguna berhenti menginput. Unduh backup melalui Pengaturan dan ekspor seluruh database melalui phpMyAdmin. Simpan juga salinan folder aplikasi/config di luar htdocs.
2. Stop Apache. Ekstrak ZIP perubahan ini; salin isinya ke folder aplikasi, misalnya `C:\xampp\htdocs\ternus`, lalu pilih Replace. `index.html` harus tetap di root folder aplikasi. Jangan menghapus folder lama: ZIP ini berisi perubahan kumulatif, bukan seluruh aplikasi. Tidak perlu memasang ZIP revisi sebelumnya satu per satu.
3. Pertahankan `server/config.php` yang lama. Jangan mengganti nama database, mengimpor ulang seed, atau menjalankan installer. ZIP tidak menyertakan konfigurasi/isi database pengguna.
4. Start Apache dan MySQL. Buka alamat localhost yang biasa dipakai, lakukan Ctrl+F5, lalu login sebagai owner.
5. Buka **Pengaturan → Pindahkan ke tabel terpisah**. Pastikan backup tersimpan; klik **Migrasi Database**, centang konfirmasi, lalu **Mulai Migrasi**. Tunggu hasilnya. Jangan menutup halaman atau menjalankan salinan aplikasi dengan kode lama selama migrasi.
6. Panel akan berubah menjadi **Tabel terpisah sudah aktif**. Periksa jumlah pengguna, stok, invoice, piutang, dan log; coba login akun tambahan dengan email/password yang sama. Refresh phpMyAdmin untuk melihat tabel baru.

Penggunaan sehari-hari tetap sama. Semua quick edit, pengaturan bisnis/modul, riwayat aktivitas, dan perbaikan posisi scroll dari revisi sebelumnya ikut dalam ZIP ini.

Jika migrasi gagal, format lama tetap aktif dan perubahan baris dibatalkan. Tabel tujuan kosong dapat tertinggal karena DDL MySQL tidak ikut rollback. Periksa log PHP XAMPP, perbaiki penyebabnya, lalu ulangi. Jangan menghapus atau mengedit data sumber agar sekadar melewati pemeriksaan. Tabel tujuan yang sudah berisi data atau tabel bernama sama di luar skema migrasi akan ditolak.

## Yang dilindungi saat migrasi

- Hak owner diperiksa sebelum pembuatan tabel dan diperiksa ulang di dalam proses migrasi. Permintaan browser memakai proteksi CSRF yang sama dengan perubahan lain.
- ID, urutan data, tipe nilai, data tambahan, hash password, stok, dan seluruh transaksi dibandingkan dengan hasil pembacaan tabel. Mode baru aktif hanya jika verifikasi cocok.
- Penulisan dibungkus transaksi; relasi memakai foreign key dan identitas bisnis tertentu memakai indeks unik. Data yang tidak konsisten akan menghentikan migrasi, bukan dibuang diam-diam.
- Satu kunci aplikasi mencegah dua migrasi/penulis berjalan bersamaan. Menjalankan migrasi lagi sesudah sukses tidak menggandakan data.
- `app_state` lama tetap utuh sebagai arsip saat migrasi. Transaksi baru hanya masuk ke tabel baru; jangan memakai arsip itu untuk menilai saldo terkini.
- Password tidak diganti/reset. Masalah login yang sudah ada sebelumnya tidak otomatis diperbaiki oleh migrasi; owner dapat mereset password melalui Pengguna seperti biasa.

## Melihat data di phpMyAdmin

Pilih database yang sama seperti `server/config.php`, lalu klik tabel dan **Browse/Jelajahi**. Ada **40 tabel data + 1 tabel metadata**. Pada database hasil migrasi, `app_state` tambahan tetap ada sebagai arsip; instalasi baru tidak membuat tabel tersebut.

| Data | Tabel |
|---|---|
| Pengguna, lokasi, kamus SKU | `users`, `locations`, `sku_terms` |
| Produk, pelanggan, vendor | `products`, `customers`, `suppliers` |
| Batch dan hubungan asal | `stock_batches`, `batch_parents` |
| Penerimaan dan rinciannya | `receipts`, `receipt_items` |
| Produksi, bahan, hasil | `productions`, `production_inputs`, `production_outputs` |
| Transfer dan rincian | `transfers`, `transfer_items` |
| Quotation dan rincian | `quotes`, `quote_items` |
| Penjualan/order dan alokasi | `sales_orders`, `order_items`, `order_allocations` |
| Pengiriman dan rincian | `shipments`, `shipment_items` |
| Invoice dan rincian | `invoices`, `invoice_items` |
| Pembayaran, kredit, refund | `payments`, `credit_notes`, `refunds` |
| Retur dan rincian | `sales_returns`, `return_items` |
| Opname dan rincian | `stocktakes`, `stocktake_items` |
| Aset dan riwayat | `office_assets`, `asset_events` |
| Mutasi stok dan aktivitas | `stock_movements`, `audit_logs` |
| Pengaturan, penomoran, pencegah transaksi ganda, batas login | `app_settings`, `document_sequences`, `command_requests`, `login_attempts` |
| Metadata kompatibilitas dan ekstensi | `app_extensions` |
| Status/versi penyimpanan | `ternus_storage` |

Contoh SQL hanya-baca untuk melihat akun tanpa hash password:

```sql
SELECT id, name, email, role, active FROM users ORDER BY name;
```

Kolom `password_hash` berisi hash, bukan password yang dapat dibaca. Detail dokumen terhubung memakai `parent_id`, misalnya `invoice_items.parent_id = invoices.id`. Kuantitas kg tetap disimpan dalam gram integer (1000 = 1 kg); pcs dan nilai rupiah berupa integer. Saldo dihitung dari mutasi dan aturan reservasi, bukan hanya menjumlahkan semua kolom kuantitas.

Jangan mengubah tabel langsung untuk operasi sehari-hari: gunakan UI agar validasi stok, izin, dan audit tetap berjalan. Kolom `_present`, `_extra_json`, `sort_order`, serta metadata ekstensi diperlukan adapter; jangan dihapus.

## Apakah masih ada JSON?

Ada untuk nilai pengaturan per kunci, snapshot identitas invoice, detail perubahan log/aset, hasil permintaan yang mencegah duplikasi, dan data tambahan yang belum dikenali. **Invoice, penjualan, penerimaan, pengguna, dan rincian transaksi tidak lagi disimpan bersama dalam satu JSON.** Backup unduhan tetap berbentuk satu file JSON agar mudah dipindahkan; format ekspor tidak menentukan struktur penyimpanan aktif.

## Backup, restore, dan kembali ke versi lama

Sesudah migrasi, ekspor SQL harus mencakup **seluruh database**. Backup hanya `app_state` akan melewatkan semua transaksi baru.

Backup JSON lama maupun baru tetap memakai format `ternus-backup-1`. Untuk memulihkan, hentikan input semua pengguna dan simpan backup terbaru dahulu. Dari folder aplikasi:

```bat
C:\xampp\php\php.exe server\restore.php C:\backup\ternus-backup.json --replace
```

Restore mengganti seluruh data aktif secara atomik dan memakai akun dari backup. Database harus sudah terpasang. Pada skema baru, restore tetap menggunakan tabel terpisah; relasi/verifikasi yang gagal membatalkan seluruh penggantian. Tidak ada penggabungan dua backup. Arsip `app_state` tidak diperbarui oleh restore relasional.

Jangan kembali ke kode lama dengan database yang sudah dimigrasikan: kode lama membaca arsip yang sudah tertinggal. Pemulihan versi lama memerlukan salinan kode dan backup database pada waktu yang cocok. Transaksi setelah waktu backup tidak ikut kembali; simpan backup terbaru sebelum melakukan pemulihan apa pun.

## Alternatif CLI untuk migrasi

Untuk operator lokal yang memiliki akses konfigurasi database, jalankan dari folder aplikasi sesudah backup dan penghentian input:

```bat
C:\xampp\php\php.exe server\migrate.php --check
C:\xampp\php\php.exe server\migrate.php --apply
```

CLI tidak memerlukan sesi browser; aktivitas dicatat sebagai `Migrasi lokal (CLI)`. Script ditolak bila dipanggil lewat HTTP. Berkas `database/schema.sql` hanya referensi struktur, **bukan** pengganti migrator: jangan mengimpor manual untuk mengaktifkan mode baru.

## Batas dan verifikasi

Adapter masih merangkai seluruh state untuk aturan bisnis dan respons UI. Transaksi tulis masih bergantian untuk menjaga aturan stok. Penyimpanan memperbarui baris yang berubah, tetapi belum menerapkan query/pagination server per modul atau meningkatkan paralelisme transaksi. Belum ada uji beban produksi.

Uji otomatis dijalankan dengan PHP 8.3 dan MariaDB 10.11 pada database terpisah: migrasi lossless, password/login owner dan sales, transaksi lengkap setelah reload, idempotensi, rollback FK, kegagalan migrasi, retry, restore, dan penguncian dua koneksi. JavaScript diuji secara otomatis; pengujian visual pada browser XAMPP pengguna belum dilakukan.

Untuk developer, tes memori: `php tests/domain_test.php`, `php tests/business_test.php`, `php tests/audit_test.php`. Tes database memerlukan kredensial server uji dengan izin CREATE/DROP DATABASE. Gunakan server uji terpisah dan set `TERNUS_TEST_DSN`, opsional `TERNUS_TEST_USER` dan `TERNUS_TEST_PASSWORD`, lalu jalankan `tests/database_test.php` dan `tests/database_domain_test.php`. Tes membuat/menghapus hanya database acak berawalan `ternus_relational_test_`, tidak membaca `server/config.php`.
