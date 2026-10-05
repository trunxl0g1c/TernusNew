# Tambah data tanpa meninggalkan formulir

Di bawah pilihan pelanggan, vendor, lokasi atau barang tersedia tombol **+ Tambah …**. Tombol mengikuti hak akses: owner/admin dapat menambah keempat master, sales hanya pelanggan.

Contoh saat membuat quotation:

1. Isi tanggal, ongkir dan rincian barang seperti biasa.
2. Klik **+ Tambah pelanggan** di bawah pilihan pelanggan.
3. Isi nama, nomor HP, jenis dan alamat, lalu **Simpan**.
4. Formulir tambah ditutup; quotation sebelumnya tetap terbuka dan pelanggan baru langsung terpilih. Lanjutkan input atau simpan draft.

Tanggal, ongkir, jumlah, diskon, baris barang dan pilihan lainnya tetap berada pada formulir yang sama. Tidak ada perpindahan menu atau pembuatan ulang formulir induk. **Kembali**, tombol X, atau Esc hanya menutup formulir tambah. Kesalahan validasi ditampilkan di formulir tambah sehingga bisa diperbaiki tanpa kehilangan draft utama.

Pola yang sama berlaku pada seluruh pilihan master tersebut: quotation/order, penerimaan, produksi, transfer, retur, opname, aset, dan rincian barang yang mendukung pembuatan master. Baris yang ditambahkan melalui + Baris juga mendapat tombol. Barang baru pada penjualan harus diaktifkan **Boleh dijual**; setelah dipilih, harga jual otomatis diisi sesuai perilaku pilihan barang yang sudah ada. Jumlah dan diskon tetap dipertahankan.

Tombol ini membuat **data master**, bukan mengesahkan transaksi. Membuat barang belum menambah stok. Batch terbentuk melalui penerimaan/produksi; invoice dan dokumen transaksi tetap mengikuti alur bisnisnya. Jenis proses, status, metode pembayaran dan daftar pilihan tetap bukan master yang dibuat lewat tombol ini. Filter laporan tetap memakai pencarian tanpa tombol penambahan.

## Penyimpanan dan akses

Data baru tersimpan lewat command master.save yang sama dengan menu master, sehingga validasi backend, hak akses dan log tetap digunakan. Data master yang berhasil disimpan tetap ada walaupun kemudian quotation/penerimaan dibatalkan. Penyimpanan draft transaksi utama tetap merupakan tindakan terpisah.

Jika respons pemuatan ulang gagal setelah server menyimpan master, mengulang **Simpan** dengan isian yang sama mempertahankan kunci permintaan untuk mencegah duplikasi. Pesan kesalahan tetap terlihat dan formulir utama tetap utuh. Saat proses simpan masih berjalan, penutupan formulir tambah dicegah.

## Pemasangan

Salin isi folder ternus dari ZIP perubahan kumulatif ke aplikasi lengkap yang sudah ada, pilih Replace, pertahankan server/config.php, kemudian Ctrl+F5. Tidak perlu migrasi database tambahan untuk fitur ini. Jika migrasi tabel dari revisi sebelumnya belum dilakukan, panduannya tetap tersedia di MIGRASI_DATABASE.md dan berjalan terpisah.

## Verifikasi

- 66 modul JavaScript lulus pemeriksaan sintaks dan import tanpa siklus.
- Tes Quick Edit, profil bisnis/modul, audit, dan panel migrasi tetap lulus.
- Tes DOM pencarian tetap lulus.
- Chromium headless pada formulir quotation dan penerimaan asli dengan API simulasi: membuat/memilih pelanggan, vendor, lokasi dan barang; node formulir induk tetap sama; ongkir/jumlah/harga/diskon terjaga; SKU dan harga barang otomatis; Kembali/Esc; kegagalan validasi; retry pemuatan ulang tanpa duplikasi; hak akses sales.
- Tampilan formulir tambah diperiksa pada viewport desktop 1100×900 dan ponsel 390×844.

API pada pengujian browser menggunakan data simulasi, bukan database pengguna. Backend dan schema tidak diubah pada revisi ini. Perangkat iPhone/Android fisik belum diuji.

Skenario browser ada di `tests/related_create_browser_test.mjs`. Developer memerlukan Playwright dan Chromium pada lingkungan uji; opsional gunakan `TERNUS_PLAYWRIGHT_PATH` dan `TERNUS_CHROMIUM_PATH` jika diinstal terpisah. Tes menjalankan server lokal sementara dan API simulasi, tanpa memakai konfigurasi database. Pengguna aplikasi tidak membutuhkan dependensi pengujian.
