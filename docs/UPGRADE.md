# Pembaruan terbaru: database tabel terpisah

Ikuti **MIGRASI_DATABASE.md** untuk ZIP revisi ini. ZIP berisi perubahan kumulatif dan perlu disalin menimpa file di aplikasi lengkap yang sudah terpasang. Pertahankan `server/config.php` dan file yang tidak ada di ZIP; jangan mengganti seluruh folder aplikasi dengan isi ZIP perubahan.

Migrasi dijalankan terpisah oleh owner melalui Pengaturan sesudah backup. Sebelum migrasi, aplikasi tetap membaca format lama; sesudahnya, aplikasi memakai tabel terpisah. Tidak ada reset stok atau pembuatan akun ulang.

Setelah migrasi, kode lama tidak boleh digunakan dengan database yang sama. `app_state` adalah arsip pada saat migrasi, bukan data terkini. Pemulihan versi lama memerlukan kode serta backup database yang cocok; simpan dahulu backup terbaru agar transaksi setelah migrasi tidak hilang.

Jika halaman pemasangan muncul padahal sudah pernah terpasang, periksa MySQL dan `server/config.php`; jangan membuat instalasi baru untuk menutupi kesalahan koneksi.
