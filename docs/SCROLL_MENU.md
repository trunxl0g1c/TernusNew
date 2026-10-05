# Posisi scroll menu tetap

Sidebar mempertahankan posisi scroll saat pindah menu dan saat aplikasi memperbarui data, termasuk setelah menyimpan Quick Edit. Bagian Riwayat modul nonaktif yang sudah dibuka tetap terbuka saat sidebar dibuat ulang.

Posisi dipertahankan selama aplikasi terbuka, bukan disimpan permanen setelah menutup atau memuat ulang browser. Jika jumlah menu berkurang akibat perubahan modul/hak akses, browser menyesuaikan posisi ke batas scroll yang masih tersedia.

## Pemasangan

ZIP `TERNUS_Scroll_Menu_Tetap_Perubahan.zip` adalah revisi kumulatif: termasuk seluruh Quick Edit, profil/modul bisnis, dan Riwayat Aktivitas sebelumnya. Tetap membutuhkan aplikasi lengkap yang sudah ada.

Salin isi folder `ternus` dari ZIP ke folder aplikasi, misalnya `C:\xampp\htdocs\ternus`, pilih Replace, lalu Ctrl+F5. Jangan hapus folder aplikasi. Konfigurasi koneksi dan database tidak disertakan atau diganti.

## Pemeriksaan

Pemeriksaan syntax dan import JavaScript lulus. Uji browser nyata belum dijalankan di lingkungan pembuatan. Setelah pemasangan, scroll sidebar ke Pengguna / Riwayat Aktivitas / Pengaturan, lalu klik bergantian: sidebar seharusnya tetap di posisi tersebut.
