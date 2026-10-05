# v1.1 — 1 Oktober 2026

- Memecah backend menjadi HTTP kernel, controller, session guard, kontrak storage, adapter MySQL, command registry, shared helpers, dan 13 business service.
- Memecah frontend menjadi 58 ES modules dengan komponen bersama serta formulir, tabel, dan aksi per fitur. Hubungan dependency diperiksa agar tidak melingkar.
- Memisahkan lifecycle rendering dari API client melalui event `ternus:state-changed`.
- Memindahkan styling ke Tailwind CSS 4.1.18 dengan source komponen terpisah dan hasil build lokal yang sudah disertakan.
- Memformat PHP/JS/HTML/CSS serta embedded HTML; menambahkan Prettier, EditorConfig, lockfile dan scripts developer.
- Memperbaiki spacing/dialog setelah Tailwind Preflight dan menyembunyikan ikon statistik pada layar kecil agar label tetap terbaca.
- Memastikan token CSRF hanya diterima bila token sesi sudah dibuat.
- Menambahkan dokumentasi developer, peta modul dan prosedur upgrade/rollback.
- Mempertahankan format database, seed master, satuan stok, nama command, dan format backup v1. Tidak menambahkan migrasi schema atau menghapus transaksi.

Arsitektur masih modular monolith. Belum ada pemisahan service ke proses/database terpisah atau penggantian dokumen state menjadi schema relasional.
