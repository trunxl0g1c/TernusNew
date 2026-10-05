import { panel, btn } from '../../components/ui.js';
import { state } from '../../core/state.js';
import { e } from '../../core/format.js';
import { api, load } from '../../core/api.js';
import { openForm } from '../../components/modal.js';
import { toast } from '../../components/feedback.js';
export function storagePanel() {
  const s = state.storage;
  if (!s) return '';
  if (s.mode === 'relational') return panel('Penyimpanan database', `<div class="panel-body"><p><strong>Tabel terpisah sudah aktif.</strong> Akun, barang, rincian transaksi, mutasi stok, dan riwayat disimpan terpisah.</p><p class="footer-note">${e(s.table_count)} tabel data · Aktif sejak ${e(s.migrated_at || 'instalasi')}. Backup melalui phpMyAdmin harus mencakup seluruh database.</p></div>`);
  return panel('Pindahkan ke tabel terpisah', `<div class="panel-body"><p>Database masih menggunakan format lama. Migrasi mempertahankan akun, password, transaksi, stok, dan riwayat yang ada. Data lama disimpan sebagai arsip.</p><p>Unduh backup, lalu minta pengguna lain berhenti menginput selama migrasi.</p><div class="actions">${btn('1. Unduh Backup', 'backup')}${btn('2. Migrasi Database', 'database-migrate', '', 'primary')}</div></div>`);
}
export const storageActions = {
  'database-migrate': async () => {
    openForm('Migrasi ke tabel terpisah', '<p>Data akan dipindahkan dan diperiksa sebelum tabel baru diaktifkan. Tunggu sampai hasil migrasi muncul.</p><div class="field"><label><input type="checkbox" name="confirmed" required> Saya sudah menyimpan backup dan menghentikan input pengguna lain.</label></div>', async () => {
      const result = await api('migrate', { confirm: true });
      await load();
      toast(result.message);
    }, 'Mulai Migrasi');
  },
};
