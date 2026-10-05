# TERNUS Inventory — XAMPP v1.1 (Modular + Tailwind)

> **Paket siap repository GitHub:** baca [PANDUAN_GITHUB.md](PANDUAN_GITHUB.md)
> untuk upload pertama, menjalankan aplikasi, dan push perubahan.
>
> **Sebelum menjalankan:** salin `server/config.example.php` menjadi
> `server/config.php`, lalu sesuaikan koneksi database. File konfigurasi lokal
> diabaikan oleh Git dan tidak disertakan dalam paket. Jika konfigurasi sudah ada,
> pertahankan file tersebut.


Aplikasi web lokal dengan profil bisnis dan modul yang dapat disesuaikan; profil awal kopi Teras Nusantara. Tidak memerlukan npm, Composer, koneksi internet, atau proses build. Antarmuka menggunakan index.html, JavaScript ES modules, dan Tailwind CSS lokal; penyimpanan permanen memakai PHP + MySQL/MariaDB.

## Perbaikan migrasi

Jika log menunjukkan `array_is_list()` tidak tersedia pada PHP 8.0, revisi ini mengganti pemanggilan tersebut dengan pemeriksaan kompatibel. Pasang perubahan, restart Apache, lalu ulangi migrasi. Baca **docs/FIX_MIGRASI_ARRAY_IS_LIST.md**.

## Tambah data dari formulir

Pilihan pelanggan, vendor, lokasi dan barang mendukung **+ Tambah** sesuai hak akses. Formulir sebelumnya tetap utuh dan data baru langsung terpilih. Baca **docs/TAMBAH_LANGSUNG.md**.

## Dropdown pencarian

Semua dropdown pilihan tunggal mendukung pencarian dengan mengetik, termasuk Quick Edit dan baris baru. Barang di rincian transaksi dapat dicari berdasarkan nama/SKU. Baca **docs/DROPDOWN_PENCARIAN.md**.

## Revisi database

Pengguna lama: pasang ZIP perubahan pada aplikasi lengkap yang sudah ada, pertahankan `server/config.php`, lalu ikuti **docs/MIGRASI_DATABASE.md**. ZIP ini kumulatif dan bukan paket instalasi lengkap. Jangan menghapus folder aplikasi lama.

## Perubahan versi 1.1

Backend dipisah menjadi HTTP controller, storage adapter, shared helpers, dan business service per modul. Frontend memakai ES modules per fitur. CSS sumber menggunakan Tailwind dan file komponen yang rapi; hasil build sudah disertakan. Baca **docs/DEVELOPER.md** untuk peta file dan cara editing, **docs/UPGRADE.md** untuk mempertahankan data dari v1.

Arsitektur versi ini adalah modular monolith, belum microservice. Instalasi baru memakai tabel terpisah. Database lama tetap terbaca sebelum owner menjalankan migrasi; baca **docs/MIGRASI_DATABASE.md**. Batas fitur bisnis versi awal tetap berlaku.

## Mulai dalam 5 langkah

1. Ekstrak ZIP. Salin folder **ternus** ke **C:\xampp\htdocs\ternus**. Pastikan index.html langsung berada di dalam folder itu, bukan ternus\ternus.
2. Buka XAMPP Control Panel dan klik **Start** untuk **Apache** dan **MySQL**.
3. Buka browser ke **http://localhost/ternus/index.html**. Jika Apache memakai port 8080, gunakan **http://localhost:8080/ternus/index.html**.
4. Pada halaman pemasangan, isi nama, email, dan password owner (minimal 10 karakter). Klik **Pasang aplikasi**. Database dan tabel dibuat otomatis.
5. Login memakai akun tadi. Periksa Data Barang, buat vendor/pelanggan, lalu mulai Penerimaan.

**Jangan membuka index.html dengan klik ganda/file://.** PHP harus berjalan melalui alamat localhost. Halaman index.html memberikan petunjuk jika dibuka langsung.

## Kebutuhan

- PHP 8.1 atau lebih baru, ekstensi pdo_mysql dan session.
- MySQL 5.7+ atau MariaDB 10.4+; engine InnoDB.
- Browser modern, JavaScript aktif. Semua aset antarmuka disertakan lokal.
- Default XAMPP: host 127.0.0.1, port 3306, user root, password kosong.
- Jika berbeda, edit **server/config.php** sebelum pemasangan. Nama database bawaan: **ternus_inventory**.
- Jangan memakai database yang sama untuk dua salinan aplikasi. Ganti nama database di config untuk instalasi kedua.

## Data awal

Tiga lokasi tersedia: Kebun, Gudang, Store. Terdapat 89 master produk dari file TERNUS - Data Stock (1).xlsx. Harga per gram pada sumber dikonversi menjadi harga per kg untuk input aplikasi. Tinjau nama, kategori, berat isi dan harga sebelum dipakai. Ini bukan validasi harga bisnis.

**Saldo awal kosong.** Riwayat pelanggan, nomor telepon, transaksi dan invoice lama tidak diimpor. Tidak ada password, invoice atau transaksi contoh bawaan. Buat akun tambahan melalui Pengguna; hanya owner dapat mengelolanya.

## Fitur yang berjalan

- Dashboard stok per lokasi, nilai barang terkirim, invoice dan outstanding.
- Master produk, pelanggan, vendor, lokasi, kamus kode SKU; arsip/aktifkan/hapus jika belum direferensikan; pilihan banyak baris dan CSV.
- Generate saran SKU dari kamus, penolakan SKU ganda. Quick Edit langsung di baris melalui klik dua kali untuk semua master yang mendukungnya.
- Penerimaan langsung cherry/gabah/greenbeans/roasted dari kebun atau vendor; batch otomatis dan biaya total.
- Stok dan riwayat batch, penelusuran beberapa induk, reservasi, WIP, perjalanan dan karantina.
- Produksi dua tahap: Mulai memindah bahan ke WIP, Selesaikan mencatat beberapa output, susut dan alokasi biaya.
- Pengemasan memakai bahan kopi dan produk pouch kosong; hasil produk kemasan memakai pcs dan berat isi gram.
- Transfer dengan penerimaan sebagian.
- Quotation draft → diterima → Assign to Invoice; menghasilkan satu order dan draft invoice.
- Order langsung, reservasi batch tertua, pengiriman sebagian, pembatalan order sebelum pengiriman/invoice terbit.
- Invoice draft/terbit; cetak atau Simpan PDF menggunakan fasilitas browser. Satu invoice per order.
- Pembayaran sebagian/lunas, kredit dan refund. Admin mencatat pembayaran langsung sebagai terverifikasi; kredit/refund khusus owner.
- Retur fisik masuk karantina; Lolos Inspeksi menambah stok layak kembali. Kredit invoice dicatat terpisah oleh owner.
- Opname dengan penguncian lokasi dan persetujuan owner. Selisih di bawah reservasi ditolak.
- Aset kantor, peminjaman, pengembalian, perpindahan, perawatan dan riwayat.
- Akun owner/admin/sales, hak akses pada server, CSRF, session, audit dan backup JSON.

## Alur uji pertama yang disarankan

1. Tambah satu pelanggan dan vendor. Tinjau produk Green Beans dan Roasted Beans yang ingin dipakai.
2. Penerimaan: Gudang, sumber vendor, 10 kg greenbeans. **Total biaya** misalnya Rp1.000.000, bukan Rp100.000 per kg.
3. Produksi: pilih batch 10 kg. Selesaikan dengan hasil 8,4 kg, tambahan biaya Rp50.000, total biaya output Rp1.050.000.
4. Buat order 1 kg roasted beans. Konfirmasi; stok fisik tetap dan reservasi bertambah.
5. Buat/terbitkan invoice. Admin mengirim 1 kg dari order; stok fisik baru berkurang pada saat ini.
6. Catat pembayaran sebagian, lihat outstanding turun; lunasi sisanya.

Transaksi yang disahkan tidak dapat diedit atau dihapus lewat tabel. Karena beberapa koreksi lanjutan belum tersedia, gunakan database uji terpisah untuk latihan sebelum memasukkan saldo operasional.

## Hak akses

Owner: semua modul, pengaturan, akun, kredit/refund dan approval opname.
Admin: master, penerimaan, produksi, transfer, pengiriman, pembayaran, opname, aset; tidak mengelola akun/pengaturan atau menyetujui opname.
Sales: produk jual dan stok, pelanggan, quotation, order, invoice miliknya, status pembayaran terkait. Sales tidak melihat biaya bahan, audit, akun lain, atau memposting stok/pembayaran. Akun owner dan admin dapat melihat semua dokumen sales.

## Batas versi ini dibanding spesifikasi v2

Ini implementasi awal yang bisa dijalankan, bukan implementasi lengkap seluruh butir dokumen 34 halaman. Keterbatasan konkret:

- Quick Edit dilakukan langsung di baris; paste grid massal seperti Excel belum tersedia. CSV merupakan ekspor, bukan impor transaksi.
- Quotation belum memiliki revisi/versi dan status kirim/tolak. Invoice tanpa perhitungan pajak otomatis, IDR saja. Penjualan terkirim pada dashboard masih bruto sebelum retur, bukan laba final.
- Belum ada unggahan bukti/foto, barcode/QR, email otomatis, notifikasi, termin per pelanggan, split invoice, DP, atau pembayaran lintas invoice. Bukti pembayaran berupa referensi teks.
- Catatan biaya harus lengkap saat transaksi; revisi biaya historis dan propagasi HPP belum tersedia. HPP proporsional batch dibulatkan ke rupiah per pengeluaran dan belum memakai distribusi residu biaya khusus.
- Belum ada pembalikan umum penerimaan/produksi, pembatalan WIP, pembatalan sisa order yang sudah terkirim, penghapusan stok rusak, atau penyelesaian kehilangan transfer. Stok opname menyesuaikan fisik; tidak mengganti proses koreksi tersebut.
- Opname hanya baris batch dengan saldo fisik nonnol; batch/temuan baru dimasukkan melalui penerimaan setelah sesi ditutup. Semua lokasi memakai role yang sama; belum ada pembatasan pengguna per lokasi.
- Profil sales memakai akun pengguna; belum ada master cabang/tipe pelanggan yang terpisah lengkap seperti dokumen.
- Aset belum menghitung penyusutan, tenggat pinjaman, biaya perawatan, atau konversi stok menjadi aset.
- Setelah migrasi, data disimpan dalam 40 tabel data dan satu tabel metadata; `app_state` lama menjadi arsip. Penyimpanan menulis baris yang berubah. Domain/API masih membaca seluruh state dan transaksi tulis masih bergantian. Pagination server serta uji beban produksi belum tersedia.
- Hanya untuk penggunaan lokal/uji jaringan internal. Publikasi internet perlu konfigurasi HTTPS, akun DB terbatas, backup terjadwal, hardening server, peninjauan keamanan dan pengujian deployment tersendiri. Jangan membuka instalasi XAMPP default langsung ke internet.

## Backup dan pemulihan

1. Login owner → Pengaturan → Unduh Backup JSON. Simpan di luar htdocs. File memuat data dan hash password sehingga harus dijaga.
2. Alternatif: phpMyAdmin → ternus_inventory → Export SQL **seluruh tabel**, bukan hanya app_state. Simpan juga folder aplikasi/config.
3. Untuk memulihkan JSON: hentikan penggunaan aplikasi oleh seluruh pengguna, backup database saat ini, lalu jalankan dari Command Prompt:

   cd C:\xampp\htdocs\ternus
   C:\xampp\php\php.exe server\restore.php C:\backup\ternus-backup-2026-09-30.json --replace

Pemulihan mengganti seluruh isi aplikasi. Database/tabel harus sudah dibuat lewat installer. Gunakan akun dari backup setelah pemulihan. Jangan menaruh backup dalam folder publik.

## Tes yang disertakan

Jalankan **C:\xampp\php\php.exe tests\domain_test.php** dari folder aplikasi. Tes memakai data dalam memori, bukan database pengguna. Pemeriksaan mencakup campuran batch, susut/HPP, transfer parsial, reservasi, pengiriman parsial, invoice, pembayaran/kredit/refund, retur, opname, aset dan izin.

## Pemecahan masalah

- Halaman menyuruh membuka localhost: gunakan URL, bukan file://.
- Not Found: periksa folder C:\xampp\htdocs\ternus\index.html.
- Database gagal: pastikan MySQL aktif, port dan password server/config.php tepat; baca Apache → Logs → PHP error log di XAMPP.
- Port Apache bentrok: gunakan port Apache yang tampil di Control Panel, misalnya 8080.
- Tanggal transaksi ditolak: periksa tanggal komputer, periode tutup, dan tanggal mutasi terakhir batch. Mutasi stok tidak dapat mundur sebelum mutasi terakhir batch yang sama.
- Stok cukup tetapi tidak bisa dipakai: periksa reservasi order, WIP, transit, karantina, atau kunci opname.
- Produk punya SKU sama: pilih produk yang sudah ada atau ubah SKU varian; jangan menduplikasi identitas barang yang sama.

## Struktur dan pengembangan

Lihat **docs/DEVELOPER.md** untuk struktur lengkap. Entry point: `index.html`, `api.php`, `assets/js/main.js`. Business service: `app/Modules/`. Akses database: `app/Infrastructure/`. Styling sumber: `resources/css/`; hasil build: `assets/css/app.css`.

Untuk developer yang ingin mengubah styling: jalankan `npm ci`, lalu `npm run watch:css`. Untuk menjalankan aplikasi sehari-hari tidak memerlukan Node.js, npm, Composer, CDN, atau internet.

Folder `app`, `server`, dan `tests` dilindungi .htaccess pada Apache. Jangan menghapus file tersebut. Aplikasi tidak mengirim data operasional ke layanan eksternal.
#   T e r n u s N e w  
 