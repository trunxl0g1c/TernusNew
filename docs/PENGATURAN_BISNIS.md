# Pengaturan Bisnis dan modul aktif

## Pasang pada aplikasi yang sudah ada

1. Unduh backup melalui Pengaturan sebelum memasang perubahan backend.
2. Tutup tab aplikasi. Ekstrak ZIP, lalu salin ISI folder `ternus` ke folder
   aplikasi yang sudah ada, misalnya `C:\xampp\htdocs\ternus`.
   Gabungkan folder dan replace file yang sama; jangan membuat `ternus\ternus`.
3. Buka `http://localhost/ternus/` lalu tekan Ctrl+F5.
4. Login sebagai owner → Pengaturan → Pengaturan Bisnis.

ZIP ini merupakan patch kumulatif untuk TERNUS Inventory v1.1 / paket GitHub
yang telah diberikan. Sudah termasuk seluruh Quick Edit inline sebelumnya.
Ini bukan instalasi source lengkap. Jangan menghapus folder aplikasi lama.
Konfigurasi `server/config.php`, file produk awal, dan database tidak disertakan
atau ditimpa. Tidak perlu migrasi SQL, reset database, install ulang, atau build CSS.
Seluruh file PHP dan JavaScript dalam patch perlu disalin bersama.

## Cara menggunakan

- Pilih profil Kopi, Toko / retail, Distributor, Produksi umum, atau Usaha lainnya.
- Untuk mengambil rekomendasi modul dan kategori dari profil, klik
  **Terapkan preset ke pilihan di bawah**. Tombol ini hanya mengisi form;
  perubahan belum disimpan dan tidak mengganti produk/lokasi lama.
- Sesuaikan centang modul, kategori/tahap, serta jenis proses.
- Klik **Simpan Pengaturan Bisnis**. Menu dan tindakan langsung diperbarui.
- Profil yang dipilih tanpa menekan tombol preset hanya mengubah identitas profil;
  pilihan modul/kategori dalam form tetap mengikuti pilihan Anda.
- Identitas perusahaan dan periode tutup tetap disimpan melalui form terpisah
  **Simpan Pengaturan**. Kedua pengaturan saling dipertahankan.

Instalasi lama otomatis memakai profil Kopi dengan seluruh modul aktif sampai
owner menyimpan pilihan baru. Tidak ada penghapusan seed atau penggantian saldo.

## Modul dan ketergantungan

| Modul | Memerlukan |
| --- | --- |
| Penerimaan | Fitur dasar |
| Produksi | Fitur dasar |
| Pengemasan | Produksi |
| Transfer lokasi | Fitur dasar |
| Stok opname | Fitur dasar |
| Penjualan / order | Fitur dasar |
| Quotation | Penjualan dan Invoice, karena konversi membuat keduanya |
| Pengiriman | Penjualan |
| Invoice | Penjualan |
| Pembayaran / kredit / refund | Invoice |
| Retur | Pengiriman |
| Inventaris kantor | Fitur dasar |

Dashboard, barang, stok, pelanggan, vendor, lokasi, kamus SKU, akun, pengaturan,
dan audit tetap menjadi fitur dasar sesuai hak akses pengguna.
Mengaktifkan modul otomatis mencentang prasyaratnya. Menonaktifkan prasyarat
otomatis menonaktifkan fitur yang bergantung padanya. Semua hasil masih dapat
ditinjau di form sebelum disimpan. Backend juga memvalidasi ketergantungan.

## Data dan riwayat

Modul nonaktif dikeluarkan dari menu utama dan dipindahkan ke bagian
**Riwayat modul nonaktif**. Riwayat dapat dilihat, dicetak bila tersedia, dan
diekspor. Tombol pembuatan/perubahan transaksi disembunyikan; endpoint perubahan
juga menolak operasi modul tersebut.

Transaksi yang belum selesai, reservasi, WIP, perjalanan, atau kunci opname
tidak dihapus/dibatalkan ketika modul nonaktif. Aktifkan kembali modul beserta
prasyaratnya untuk menyelesaikan transaksi tersebut. Ini juga berlaku untuk
proses Pengemasan lama ketika hanya modul Pengemasan dinonaktifkan.

Pengaturan memakai nomor revisi agar form lama tidak menimpa pengaturan owner
lain. Jika muncul pesan pengaturan telah berubah, muat ulang dan tinjau pilihan terbaru.
Menonaktifkan modul tidak menyembunyikan riwayat dari pengguna yang memang
memiliki hak melihatnya; ini pengaturan fitur, bukan pengganti pengaturan role.

## Penyesuaian usaha dan batas tahap ini

- Identitas perusahaan tampil di header halaman dan bagian bawah sidebar.
- Kategori/tahap produk bisa ditulis sendiri, satu per baris. Kategori produk lama
  tetap tersedia di form agar produk yang sudah tercatat tetap dapat diedit.
- Jenis proses bisa diatur sendiri. Pengemasan memakai pilihan modul khusus
  dan otomatis dimasukkan ke pilihan proses; jangan memasukkannya ke daftar manual.
- Sumber penerimaan dan dashboard menyesuaikan profil non-kopi.
- Lokasi dapat diubah melalui master Lokasi yang sudah tersedia.
- **Satuan tetap kg dan pcs**, dengan perhitungan stok lama. Satuan liter/meter/dus,
  konversi satuan baru, varian ukuran/warna, resep/BOM khusus, dan akuntansi lanjutan
  belum ditambahkan dalam tahap pengaturan modul ini.
- Memilih profil retail tidak otomatis membuang produk kopi. Arsipkan produk
  yang tidak dipakai melalui Data Barang bila diperlukan.

## Pemeriksaan

Sudah dijalankan pada lingkungan persiapan:

- Sintaks dan import 62 modul JavaScript; tidak ada circular dependency.
- Tes lima preset, 12 modul, grafik ketergantungan, seluruh mapping command,
  penonaktifan tombol, akses riwayat, pengemasan, rendering pengaturan, dan role.
- Regresi Quick Edit pada enam master: simpan/batal, validasi, error/retry,
  pelestarian version/atribut, dan tidak mengirim password pengguna.

Tes frontend menggunakan Node dan simulasi DOM/API, bukan integrasi browser.
Runtime PHP dan database MySQL tidak tersedia di lingkungan persiapan, sehingga
tes PHP berikut disertakan tetapi belum dijalankan. Dari PowerShell di folder ternus:

```powershell
node scripts/check-modules.mjs
node tests/inline_edit_test.mjs
node tests/business_test.mjs
C:\xampp\php\php.exe tests/domain_test.php
C:\xampp\php\php.exe tests/business_test.php
```

Tes PHP menggunakan data dalam memori dan tidak terhubung ke database operasional.
Untuk pemeriksaan manual, gunakan salinan database uji: nonaktifkan Produksi,
pastikan riwayat masih bisa dilihat dan tombol Mulai/Selesaikan hilang; aktifkan
kembali lalu pastikan tindakan tersedia. Uji pula preset retail dan refresh halaman
untuk memastikan pilihan tersimpan.
