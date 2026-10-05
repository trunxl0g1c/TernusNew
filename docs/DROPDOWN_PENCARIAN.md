# Dropdown dengan pencarian

Klik/tap kolom pilihan, lalu ketik sebagian nama. Daftar langsung disaring tanpa membedakan huruf besar/kecil. Beberapa kata dapat dicari sekaligus; misalnya `arabica honey`. Kolom barang di rincian transaksi juga menampilkan SKU agar kode dapat digunakan untuk mencari.

Klik hasil untuk memilih, atau gunakan panah atas/bawah lalu Enter. Esc menutup daftar tanpa mengubah pilihan. Tab berpindah ke kolom berikutnya. Ketikan yang belum dipilih tidak mengganti data tersimpan; saat keluar, label pilihan sebelumnya dikembalikan. Jika tidak ada hasil, coba kata lain. Untuk mengosongkan pilihan opsional, kosongkan kata pencarian lalu pilih `Pilih…` jika tersedia.

Pencarian berlaku otomatis pada semua dropdown pilihan tunggal saat ini: master/form, barang, pelanggan, vendor, lokasi, batch, jenis/status/role, pengaturan, filter stok/log, Quick Edit, dan baris transaksi baru. Tidak ada perubahan hak akses atau daftar data yang diizinkan oleh masing-masing modul.

## Pemasangan

Ikuti BACA_DULU_DROPDOWN.txt. ZIP perubahan bersifat kumulatif terhadap paket aplikasi awal, sehingga mencakup revisi database sebelumnya. Tetap perlu aplikasi lengkap; jangan menghapus folder lama. Pertahankan `server/config.php` dan lakukan Ctrl+F5 setelah menyalin file.

Pencarian sendiri tidak memerlukan migrasi database. Jika sudah memakai tabel terpisah, tidak perlu menjalankan migrasi lagi. Jika masih memakai JSON lama, fitur pencarian tetap dapat dipakai; migrasi tabel dilakukan terpisah sesuai panduan database.

## Catatan pengembangan

`assets/js/components/searchable-select.js` diinisialisasi oleh `main.js`. Komponen mempertahankan select asli untuk ID/name, validasi, FormData, pembacaan rincian, dan handler input/change. Input pencarian tidak mempunyai name/data-field sehingga teks pencarian tidak masuk payload transaksi.

MutationObserver menangani dropdown/baris yang ditambahkan saat aplikasi berjalan, perubahan opsi, disabled/required, dan penghapusan kontrol. Panel ditempatkan di dalam dialog aktif atau body, memakai posisi fixed, menyesuaikan viewport, dan memiliki dukungan keyboard/ARIA. CSS terpisah `assets/css/searchable-select.css` langsung dimuat di index.html; tidak memerlukan build atau CDN. Tidak ada library tambahan pada aplikasi saat dijalankan.

Select multiple dan listbox native size > 1 tidak diubah; aplikasi saat ini tidak memakai keduanya.

## Verifikasi revisi ini

- 65 modul JavaScript lulus pemeriksaan sintaks/import.
- Tes quick edit, modul bisnis, dan log tetap lulus.
- Tes DOM komponen: pencarian nama/SKU, keyboard/klik, hasil kosong, ID/FormData, change handler, required/disabled, reset, opsi/baris dinamis, escaping label, dan penutupan panel saat kontrol/dialog hilang.
- Chromium headless dengan fixture yang menggunakan komponen formulir dan rincian transaksi asli: pencarian dari 150 barang, pemilihan lewat klik/Enter, harga otomatis, + Baris, pembacaan payload, Escape tidak menutup dialog, dan batas layar pada viewport 1100×850 serta 390×844. Screenshot desktop/ponsel diperiksa.

Tes Chromium memakai data simulasi, bukan database pengguna. Belum diuji pada perangkat iPhone/Android fisik atau semua browser. Tes database dari revisi sebelumnya tidak diulang karena revisi ini tidak mengubah backend.

Tes DOM untuk developer tersedia di `tests/searchable_select_test.mjs`; membutuhkan jsdom 26.1.0 di lingkungan uji. Jalankan `node tests/searchable_select_test.mjs` jika jsdom dapat di-resolve, atau set `TERNUS_JSDOM_PATH` ke path absolut `jsdom/lib/api.js` pada instalasi uji terpisah. Pengguna aplikasi tidak perlu memasang jsdom.
