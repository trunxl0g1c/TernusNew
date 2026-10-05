# Perbaikan migrasi: array_is_list tidak tersedia

Log tanggal 5 Oktober 2026 menunjukkan Apache menjalankan PHP 8.0.30 dan migrasi berhenti dengan `Call to undefined function Ternus\Infrastructure\array_is_list()`. Error konfigurasi yang ada pada potongan log tanggal 1 Oktober adalah kejadian terpisah; tidak perlu mengganti konfigurasi yang sekarang sudah bekerja.

`RelationalCodec` sebelumnya menggunakan fungsi bawaan tersebut untuk membedakan daftar berurutan dari map. Perbaikan menggantinya dengan pemeriksaan kunci integer 0, 1, 2, ... yang tersedia tanpa fungsi PHP 8.1 tersebut. Pemeriksaan tetap mempertahankan urutan rincian, menangani daftar kosong, membedakan map, dan menolak rincian dengan indeks tidak berurutan. Verifikasi data, transaksi, dan rollback tidak dinonaktifkan.

Ikuti BACA_DULU_FIX_MIGRASI.txt, kemudian jalankan migrasi lagi. Schema tidak berubah; jangan menghapus tabel yang telah dibuat percobaan sebelumnya. Migrator akan menggunakan kembali struktur persiapan yang sesuai dan tetap menolak tabel tujuan yang sudah berisi data agar tidak menimpanya.

## Validasi

- 13 pemeriksaan list/map, digest dan roundtrip codec lulus dengan fungsi native tersedia, lalu lulus lagi saat `array_is_list` dinonaktifkan.
- 33 pemeriksaan database lulus dengan fungsi tersebut dinonaktifkan, termasuk migrasi, login/hash, rollback, retry migrasi dan restore.
- 31 pemeriksaan alur bisnis yang menulis/membaca tabel setelah setiap operasi juga lulus saat fungsi tersebut dinonaktifkan.
- Pemeriksaan sintaks PHP pada codec dan tes baru lulus.

Pengujian menggunakan PHP 8.3.6 + MariaDB 10.11.14 pada database terpisah dengan `disable_functions=array_is_list` untuk mereproduksi ketiadaan fungsi. Ini pengujian perbaikan spesifik, bukan sertifikasi seluruh aplikasi pada runtime PHP 8.0 atau Windows/XAMPP pengguna. Database pengguna tidak diakses.

Untuk mengulang tes tanpa database: `php -d disable_functions=array_is_list tests/relational_list_test.php`. Tes database mengikuti MIGRASI_DATABASE.md dengan flag yang sama.
