# Quick Edit langsung di seluruh tabel master

## Memasang patch

1. Tutup tab TERNUS yang sedang terbuka.
2. Ekstrak ZIP lalu salin ISI folder ternus ke folder aplikasi yang sudah ada,
   misalnya C:\xampp\htdocs\ternus. Gabungkan folder dan replace file yang sama.
   Jangan membuat folder ternus\ternus.
3. Buka kembali http://localhost/ternus/ dan tekan Ctrl+F5.

Ini patch kumulatif untuk TERNUS Inventory v1.1 / paket GitHub yang diberikan:
dapat dipasang sebelum atau sesudah patch Quick Edit produk sebelumnya.
Tidak berisi konfigurasi pribadi, PHP backend, data awal produk, atau database.
Tidak perlu npm install, build CSS, migrasi, reset, atau pemasangan ulang.

## Halaman dan kolom yang didukung

| Halaman | Kolom Quick Edit | Hak akses |
| --- | --- | --- |
| Data Barang | Nama, harga jual, harga dasar | Owner dan admin |
| Pelanggan | Nama, tipe, kontak, alamat | Owner, admin, sales |
| Vendor | Nama, tipe, kontak, alamat | Owner dan admin |
| Lokasi | Nama lokasi | Owner dan admin |
| Kamus SKU | Nama, kode SKU | Owner dan admin |
| Pengguna | Nama, email, role | Owner saja |

Harga dasar tetap tidak ditampilkan kepada sales. Tipe pelanggan/vendor dan role
menggunakan dropdown langsung di sel. Password dan aktivasi akun tetap melalui
Edit Detail. SKU barang, satuan, tahap dan pengaturan produk lain tetap melalui
Edit Detail. Kolom kode pada Kamus SKU berbeda dari SKU barang.

## Cara menggunakan

- Klik dua kali baris atau klik Quick Edit untuk membuka input di baris itu,
  tanpa modal/popup Quick Edit.
- Klik dua kali sel yang mendukung Quick Edit untuk memfokuskan kolom tersebut.
- Tab/Shift+Tab berpindah input. Enter atau Simpan menyimpan satu baris.
- Escape dari input/dropdown, atau Batal, membuang perubahan baris.
- Klik di luar baris tidak otomatis menyimpan. Selesaikan baris sebelum membuka baris lain.
- Draft tetap ditampilkan jika pencarian atau filter arsip menyembunyikan barisnya.
  CSV tetap menggunakan hasil filter dan data tersimpan, bukan nilai draft.
- Simpan sebelum pindah menu atau refresh; draft belum tersimpan dibuang saat pindah menu.
- Nilai input tetap tersedia jika server menolak penyimpanan. Untuk konflik versi,
  catat perubahan, muat ulang data terbaru, lalu terapkan kembali perubahan yang diperlukan.
- Tambah dan Edit Detail tetap memakai form popup karena bukan Quick Edit.
- Quick Edit tidak ditambahkan ke transaksi yang sudah disahkan, invoice, stok,
  atau modul lain yang tidak menyediakan operasi edit master tersebut.

## Kontrak dan pemeriksaan

Lima master menggunakan master.save dengan version dan atribut non-edit yang dipertahankan.
Pengguna memakai user.save dengan id, nama, email, role, dan status aktif lama.
Password atau hash password tidak dikirim oleh Quick Edit. Hak akses dan perlindungan
owner aktif terakhir tetap divalidasi endpoint backend yang sudah ada.
Konfigurasi dan struktur database tidak diubah.

CSS tambahan: assets/css/inline-edit.css, dimuat oleh index.html.
Aturan field dan permission: assets/js/modules/master-data/inline-schema.js.
Pengendali inline: assets/js/modules/master-data/inline-edit.js.

Pemeriksaan:
- 60 modul JavaScript lolos sintaks dan import tanpa circular dependency.
- Tes enam jenis master dan matriks role, pemilihan endpoint, pelestarian atribut/version,
  tanpa password dalam payload, Enter/Escape, tidak mengirim perubahan kosong,
  error/retry, escaping, filter editor dan validasi.
- Tes dijalankan dengan DOM/API simulasi menggunakan Node:
  node tests/inline_edit_test.mjs
- Uji browser visual dan integrasi PHP/MySQL lokal belum dijalankan di lingkungan ini.
