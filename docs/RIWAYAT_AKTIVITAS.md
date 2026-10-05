# Riwayat Aktivitas TERNUS

## Pemasangan

`TERNUS_Log_Aktivitas_Perubahan.zip` adalah revisi kumulatif untuk aplikasi lengkap TERNUS. Sudah mencakup Quick Edit semua master, profil/modul usaha, dan peningkatan log. ZIP revisi sebelumnya tidak perlu dipasang satu per satu.

1. Simpan backup database dari menu Backup owner.
2. Ekstrak ZIP, lalu salin isi folder `ternus` ke folder aplikasi lengkap, misalnya `C:\xampp\htdocs\ternus`. Pilih Replace; jangan hapus folder aplikasi lama.
3. Pertahankan `server/config.php` dan database saat ini. ZIP tidak membawa konfigurasi koneksi, data operasional, atau SQL pengganti.
4. Jalankan Apache dan MySQL, buka `http://localhost/ternus/`, tekan Ctrl+F5.
5. Login owner/admin, ubah satu data contoh melalui Quick Edit, lalu periksa **Riwayat Aktivitas**.

Pada revisi database, jalankan migrasi sesuai MIGRASI_DATABASE.md; log berpindah ke tabel `audit_logs`. Log lama dipertahankan; detail sebelum–sesudah hanya tersedia untuk aktivitas setelah revisi dipasang.

## Bagian yang dicatat

| Bagian | Aktivitas |
| --- | --- |
| Master | Tambah/edit barang, pelanggan, vendor, lokasi, kamus SKU; Quick Edit; arsip, aktifkan, hapus yang diizinkan |
| Stok | Penerimaan, batch, pergerakan stok, produksi, pengemasan, transfer, hitungan/persetujuan/pembatalan opname, retur dan inspeksi |
| Penjualan | Penawaran, konversi, order, konfirmasi, pembatalan, reservasi, pengiriman |
| Tagihan | Invoice, pembayaran, nota kredit, refund; perubahan total pembayaran dan sisa tagihan yang dihitung sistem |
| Aset | Pembuatan aset dan perubahan melalui aktivitas aset |
| Pengaturan | Profil, modul aktif, tahap/proses, identitas usaha, tutup buku |
| Pengguna | Nama, email, peran, status aktif, indikator perubahan password |
| Akses | Login berhasil, logout melalui tombol Keluar, instalasi baru, permintaan ekspor backup |

Setiap log menyimpan waktu WIB, nama dan ID pelaku saat kejadian, peran, tindakan, sumber Quick Edit/form, dokumen terkait, dan nilai perubahan. Pelaku berasal dari sesi server. Label sumber merupakan informasi antarmuka, bukan bukti keamanan mandiri.

Saldo stok direkam per batch + lokasi + posisi stok, sebelum dan sesudah setiap baris mutasi. Ini bukan total semua gudang. Reservasi terlihat pada rincian order. Saldo invoice dihitung untuk log tanpa menimpa record transaksi asli.

Password/hash, token, dan rahasia dengan nama kunci sensitif tidak ditulis ke rincian log. Password hanya ditandai Ditetapkan/Diubah. Jangan menulis password dalam nama atau catatan bebas.

## Cara penggunaan

- Setiap staf menggunakan akun masing-masing.
- Simpan transaksi seperti biasa; tidak ada formulir log tambahan.
- Owner/admin membuka **Riwayat Aktivitas**, mencari nama/nomor/isi perubahan, atau memfilter pengguna, bagian, dan tanggal WIB.
- Klik baris aktivitas untuk membuka detail langsung di halaman, tanpa popup.
- **Log aktivitas** di master/transaksi membuka riwayat data terkait. Keterkaitan log lama yang tidak direkam sebelumnya tidak dapat dibuat ulang.
- **Hapus filter** menampilkan seluruh riwayat kembali; tidak menghapus log.
- Tampilan 25 aktivitas per halaman. **Ekspor CSV** mencakup seluruh hasil filter dan detail sebelum–sesudah.
- Hak akses dipertahankan: owner/admin melihat log; API tidak mengirim audit kepada sales.

Contoh: harga Rp10.000 diubah menjadi Rp12.000 lewat Quick Edit. Log menyimpan pelaku, waktu, barang dan kedua harga. Jika perlu kembali ke Rp10.000, edit kembali. Log koreksi baru muncul; log pertama tetap ada.

## Koreksi salah input

Riwayat aktivitas menjelaskan siapa mengubah apa. Mutasi stok menjadi dasar saldo. Menghapus riwayat bukan cara memperbaiki stok atau tagihan.

| Kasus | Cara yang tersedia |
| --- | --- |
| Nama/harga master/kontak salah | Edit Detail / Quick Edit. Harga transaksi lama tidak ditulis ulang. |
| Order perlu dibatalkan | Batal pada order yang memenuhi validasi; pelepasan reservasi tercatat. |
| Pelanggan mengembalikan barang | Retur dan inspeksi sesuai kejadian sebenarnya. |
| Selisih hitungan fisik | Stok Opname dan persetujuan owner; posisi stok dan reservasi tetap diperiksa. |
| Pengurangan tagihan / pengembalian uang yang sah | Nota kredit / refund melalui alur invoice yang sudah ada. |
| Salah pembayaran, penerimaan, atau produksi yang sudah diposting | Belum ada pembatalan universal. Jangan menghapus log atau menganggap nota kredit sebagai pembatalan pembayaran. Pembalikan perlu aturan khusus tiap transaksi dan pemeriksaan transaksi lanjutan. |

Panduan koreksi tampil di detail log dan membuka menu yang sudah ada; tidak mengeksekusi koreksi otomatis. Aktifkan kembali modul terkait bila perlu. Opname memperbaiki hitungan yang didukung, bukan membatalkan transaksi asal atau seluruh dampaknya.

## Batas pencatatan

- Transaksi gagal, validasi ditolak, dan login gagal tidak masuk riwayat sukses ini. Pembatasan percobaan login lama tetap berlaku.
- Membaca halaman, mengetik sebelum disimpan, batal Quick Edit, ekspor CSV lokal, mencetak dan menutup tab tanpa logout tidak dicatat.
- Log backup menunjukkan persiapan ekspor oleh server, bukan bukti file tersimpan di perangkat.
- Perubahan langsung di MySQL/skrip di luar API tidak otomatis tercatat.
- Aplikasi tidak menyediakan edit/hapus audit. Administrator database tetap dapat mengubah data langsung; ini bukan audit tahan manipulasi.
- Setelah migrasi, log disimpan per baris dalam `audit_logs`, tanpa pemangkasan otomatis. Detail perubahan masih memakai JSON per kejadian. Pagination hanya membatasi tampilan; API masih mengirim seluruh state sesuai hak akses, sehingga volume besar tetap membutuhkan pagination server.
- Nama referensi dapat ditampilkan dari master saat ini; ID dan nilai yang direkam tetap disimpan.

## Pengujian

Sudah lulus di lingkungan pembuatan:

```text
node scripts/check-modules.mjs
node tests/audit_test.mjs
node tests/inline_edit_test.mjs
node tests/business_test.mjs
```

Cakupan: syntax/import, log lama/baru, tanggal WIB, filter, pagination, ekspor seluruh hasil, HTML escaping, kg/pcs, hak akses, handler filter, regresi Quick Edit dan pengaturan modul. DOM/API disimulasikan; belum diuji di browser nyata.

PHP/MySQL tidak tersedia di lingkungan pembuatan. Skrip backend berikut disertakan tetapi BELUM dijalankan. Jalankan dari folder aplikasi menggunakan PHP XAMPP:

```bat
C:\xampp\php\php.exe tests\audit_test.php
C:\xampp\php\php.exe tests\business_test.php
C:\xampp\php\php.exe tests\domain_test.php
```

Tes audit memakai repository dalam memori, tanpa menyentuh database operasional: pelaku sesi, before/after, retry tanpa log ganda, penolakan versi lama, rollback, penyembunyian password, saldo stok/invoice, penghapusan master belum dipakai, dan pembatasan API sales. Integrasi transaksi MySQL dan tampilan browser tetap perlu diuji di XAMPP.
