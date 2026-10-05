# Panduan developer — TERNUS v1.1

## Keputusan arsitektur

Aplikasi ini adalah **modular monolith**: satu deployment PHP/XAMPP, dengan modul fitur, HTTP controller, storage adapter, komponen UI, dan styling yang dipisahkan. `api.php` hanya entry point; `main.js` hanya bootstrap dan event wiring. Kode sumber tidak diminifikasi.

Ini **belum microservice**. Seluruh transaksi tetap menggunakan satu database dan satu dokumen state. Modul domain masih berbagi state/ledger dan sejumlah helper pada `app/Support`; batasnya ditetapkan melalui struktur kode dan registry, bukan isolasi proses/database. Memisahkan folder saja tidak menghasilkan microservice. Perubahan ini mempertahankan perilaku dan format penyimpanan v1 untuk kompatibilitas data.

## Peta folder

| Lokasi                                   | Tanggung jawab                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| `index.html`                             | Entry halaman dan referensi CSS/ES module                                   |
| `api.php`                                | Menjalankan HTTP kernel; memetakan exception ke respons JSON                |
| `app/bootstrap.php`                      | Autoload namespace `Ternus` dan shared helpers                              |
| `app/routes.php`                         | Registry endpoint HTTP, metode, controller, dan kewajiban login             |
| `app/commands.php`                       | Registry nama operasi bisnis → class/method service                         |
| `app/Http/Kernel.php`                    | Routing, batas ukuran permintaan, decoding JSON                             |
| `app/Http/SessionGuard.php`              | Session, CSRF, pengguna aktif                                               |
| `app/Http/Controllers/`                  | Setup, auth, baca state/backup, eksekusi command                            |
| `app/Infrastructure/StateStore.php`      | Kontrak penyimpanan untuk controller                                        |
| `app/Infrastructure/StateRepository.php` | Adapter MySQL, transaksi, row lock, baca/simpan state                       |
| `app/Modules/`                           | Business service per fitur; tanpa SQL/HTML/session                          |
| `app/Support/`                           | Validasi, identitas, dokumen, ledger stok, helper penjualan, proyeksi state |
| `assets/js/main.js`                      | Entry JavaScript, wiring event klik/hash/state update                       |
| `assets/js/core/`                        | API client, state, formatting, data lookup, dispatcher, download            |
| `assets/js/layout/`                      | Navigasi, shell aplikasi, registry tabel transaksi                          |
| `assets/js/components/`                  | Tombol, tabel, input, modal, line items, feedback                           |
| `assets/js/modules/`                     | Tampilan, formulir, presenter tabel, dan handler aksi per fitur             |
| `resources/css/app.css`                  | Entry build Tailwind, tema, daftar source dan import komponen               |
| `resources/css/base.css`                 | Aturan elemen dasar                                                         |
| `resources/css/components/`              | Layout, auth, dashboard, form, tabel, feedback, responsive, print           |
| `assets/css/app.css`                     | Hasil build Tailwind lokal, sudah disertakan dan tidak diminifikasi         |
| `server/config.php`                      | Kredensial/host/port/database lokal                                         |
| `server/products.json`                   | Seed master barang; dipakai hanya pada pemasangan pertama                   |
| `server/domain.php`                      | Shim kompatibilitas untuk pemanggil/tests lama                              |
| `server/restore.php`                     | Pemulihan backup lewat CLI, memakai storage adapter                         |
| `tests/domain_test.php`                  | Tes aturan bisnis tanpa database                                            |
| `scripts/check-modules.mjs`              | Syntax/import check dan deteksi circular dependencies JavaScript            |

## Peta modul bisnis

| Fitur                                     | Backend                                 | Frontend                           |
| ----------------------------------------- | --------------------------------------- | ---------------------------------- |
| Master barang/pelanggan/vendor/lokasi/SKU | `app/Modules/MasterData/`               | `assets/js/modules/master-data/`   |
| Pengguna                                  | `app/Modules/Users/`                    | Form master data, jenis `users`    |
| Penerimaan                                | `app/Modules/Receiving/`                | `assets/js/modules/receiving/`     |
| Produksi/pengemasan                       | `app/Modules/Production/`               | `assets/js/modules/production/`    |
| Transfer                                  | `app/Modules/Transfers/`                | `assets/js/modules/transfers/`     |
| Quotation/order/reservasi                 | `app/Modules/Sales/`                    | `assets/js/modules/sales/`         |
| Pengiriman                                | `app/Modules/Shipping/`                 | `assets/js/modules/shipping/`      |
| Invoice/cetak                             | `app/Modules/Invoices/`                 | `assets/js/modules/invoices/`      |
| Pembayaran/kredit/refund                  | `app/Modules/Payments/`                 | `assets/js/modules/payments/`      |
| Retur                                     | `app/Modules/Returns/`                  | `assets/js/modules/returns/`       |
| Opname                                    | `app/Modules/Stocktakes/`               | `assets/js/modules/stocktakes/`    |
| Inventaris kantor                         | `app/Modules/OfficeAssets/`             | `assets/js/modules/office-assets/` |
| Pengaturan                                | `app/Modules/Settings/`                 | `assets/js/modules/settings/`      |
| Stok/traceability                         | `app/Support/Stock.php`                 | `assets/js/modules/stock/`         |
| Dashboard                                 | `app/Support/State.php` (proyeksi data) | `assets/js/modules/dashboard/`     |
| Audit                                     | `CommandController` (pencatatan)        | `assets/js/modules/audit/`         |

Tidak semua fitur membutuhkan semua jenis file. `actions.js` menangani tombol, `form.js` mengisi modal, `table.js` membentuk baris tabel, `page.js` membentuk halaman khusus. Quotation/order berbagi Sales karena menggunakan struktur baris dan lifecycle terkait; master generik sengaja memakai komponen bersama.

## Alur permintaan

1. Pengguna menekan tombol dengan `data-act` dan `data-id`.
2. `main.js` meneruskannya ke registry `core/actions.js` → handler fitur.
3. Handler/form memanggil `core/api.js`: `mutate(operation, data)`.
4. API client mengirim JSON, token CSRF, cookie session, dan idempotency key.
5. `api.php` → `Http/Kernel` → `CommandController`.
6. Controller meminta transaksi pada `StateStore`; adapter MySQL melakukan `SELECT ... FOR UPDATE`.
7. `app/commands.php` memilih service fitur. Service memvalidasi izin/status/stok lalu mengubah state dalam memori.
8. Controller menambahkan audit dan idempotency result. Repository menyimpan seluruh state dan commit; exception menyebabkan rollback.
9. Client memuat state terbaru. Event `ternus:state-changed` membuat shell merender halaman; API client tidak mengimpor tampilan.

Jangan menulis SQL di service fitur atau mengubah saldo dari frontend. Ledger dan reservasi harus tetap konsisten dalam satu command/transaksi. Izin wajib diperiksa di backend walaupun tombol disembunyikan.

## Workflow editing

Untuk **menjalankan aplikasi**, tidak ada proses npm atau Composer: aktifkan Apache/MySQL dan buka localhost. Untuk **mengembangkan CSS**, gunakan Node.js 20+ dan npm:

```bash
npm ci
npm run watch:css
```

Jalankan dari folder `ternus`. Perubahan JS/PHP langsung dapat dimuat ulang. Jika menambah class Tailwind pada HTML/template JavaScript, jalankan build/watch agar class tersebut masuk CSS. Gunakan nama utility yang lengkap seperti `bg-brand`; jangan menyusun potongan nama `bg-${color}` yang tidak terlihat saat pemindaian source.

Sebelum menyerahkan perubahan:

```bash
npm run build:css
npm run check:modules
npm run format
npm run format:check
php tests/domain_test.php
```

Pada Windows tanpa PHP di PATH, ganti `php` dengan `C:\xampp\php\php.exe`. Node hanya untuk alat developer, bukan runtime aplikasi. Tidak perlu mengunggah `node_modules` ke XAMPP/server.

Tailwind dan tool format dipasang dengan versi terkunci di `package.json` serta `package-lock.json`. File `assets/css/app.css` adalah keluaran build; edit `resources/css`, jangan mengedit hasil build karena akan tertimpa. `@apply` dipakai untuk resep komponen yang berulang. Utility Tailwind juga bisa dipakai langsung pada template. Custom CSS dipertahankan untuk kebutuhan seperti print, backdrop, dan grid khusus.

`.editorconfig` mengatur indentasi. Prettier menggunakan 2 spasi untuk JS/CSS/HTML dan 4 spasi untuk PHP. Template HTML memakai tag `html` sederhana agar formatter dapat menata markup; tag ini **tidak melakukan escaping otomatis**. Gunakan `e(value)` untuk setiap teks/atribut yang berasal dari pengguna.

## Contoh: mengubah penerimaan

- Tambah input formulir di `assets/js/modules/receiving/form.js`.
- Ubah isi baris daftar di `assets/js/modules/receiving/table.js` jika diperlukan.
- Tambah validasi dan penyimpanan nilai pada `ReceivingService::receive()`.
- Jika field muncul pada cetak/detail, ubah komponen terkait; jangan sekadar menyimpan tanpa menampilkan.
- Tambahkan tes perilaku pada `tests/domain_test.php`, misalnya sumber vendor wajib valid atau satu baris invalid membatalkan seluruh command.

Untuk **operasi baru**, tambahkan method service lalu daftarkan di `app/commands.php`. Tambahkan handler pada `actions.js` fitur yang sesuai; registry fitur yang sudah diimpor `core/actions.js` otomatis menyertakan key baru. Untuk **fitur baru**, daftarkan registry aksi baru di `core/actions.js`, item navigasi di `layout/navigation.js`, dan presenter/page pada `record-registry.js` atau router halaman `shell.js`. Ini adalah extension points eksplisit.

## Kontrak dan satuan

Endpoint kompatibel dengan v1: `api.php?action=status/setup/login/logout/state/backup/mutate`. GET: status/state/backup. POST: lainnya. Error validasi: HTTP 422; session/CSRF dan status lain ditangani kernel/guard/controller.

Contoh command (token dan cookie disediakan client):

```json
{
  "op": "receive",
  "key": "UUID-unik-per-permintaan",
  "data": {
    "location": "id-lokasi",
    "date": "2026-10-01",
    "source": "Kebun sendiri",
    "origin": "Kebun Halu",
    "lines": [{ "product": "id-produk", "qty": 10, "cost": 1000000 }]
  }
}
```

Input kg maksimal 3 desimal; domain menyimpan gram integer. Produk pcs memakai integer. Uang IDR integer. `cost` penerimaan/hasil produksi adalah total biaya baris, bukan harga per kg. State yang dikirim ke sales disaring oleh `viewState()`; jangan mengirim payload database mentah.

## Arah pengembangan berikutnya

Jika nanti dibutuhkan microservice, lebih dahulu desain tabel relasional dan ownership data, kontrak API versi, autentikasi antarservice, outbox/event, idempotensi lintas layanan, observability, serta pemulihan kegagalan terdistribusi. Produksi/reservasi/pengiriman memiliki ketergantungan stok yang perlu dirancang sebelum dipisahkan. Isolasi inventory, sales, atau billing harus menjadi proyek arsitektur tersendiri; versi ini tidak mengklaim sudah menyelesaikannya.

Rujukan Tailwind: https://tailwindcss.com/docs/installation/tailwind-cli dan https://tailwindcss.com/docs/functions-and-directives.

## Adapter database relasional

Baca `MIGRASI_DATABASE.md`. Definisi tabel ada di `app/storage-schema.json`; `RelationalSchema` membuat DDL, `RelationalCodec` memetakan array domain ke kolom dan rincian, `RelationalStore` menyimpan perubahan baris. `StateRepository` mengelola transaksi, penguncian, jalur kompatibilitas JSON, migrasi terverifikasi, dan restore atomik. `database/schema.sql` adalah referensi DDL; aktivasi wajib melalui migrator.
