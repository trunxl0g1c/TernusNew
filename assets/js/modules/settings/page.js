// modules/settings/page.js
import { area, field } from '../../components/fields.js';
import { header } from '../../components/page.js';
import { btn, panel } from '../../components/ui.js';
import { html } from '../../core/html.js';
import { state } from '../../core/state.js';
import { businessSettingsPanel } from './business.js';
import { storagePanel } from './storage.js';
export function settingsPage() {
  const x = state.data.settings;
  return (
    header(
      'Pengaturan ruang kerja',
      'Identitas pada invoice, periode transaksi, dan cadangan data.',
    ) +
    html`<section class="panel">
        <div class="panel-body">
          <form id="settings-form">
            <div class="form-grid">
              ${field('company', 'Nama perusahaan', 'text', x.company, true)}${field(
                'phone',
                'Kontak',
                'text',
                x.phone,
              )}${area('address', 'Alamat', x.address)}${area(
                'bank',
                'Informasi rekening pembayaran',
                x.bank,
              )}${field('closed_until', 'Tutup transaksi sampai tanggal', 'date', x.closed_until)}
            </div>
            <button class="btn primary" type="submit">Simpan Pengaturan</button>
          </form>
        </div>
      </section>
      ${businessSettingsPanel()}
      ${storagePanel()}
      ${panel(
        'Cadangan dan pemasangan',
        html`<div class="panel-body">
          <p>
            Unduh cadangan JSON seluruh database aplikasi. File berisi data operasional dan hash
            password; simpan di tempat yang aman. Pemulihan melalui utilitas CLI yang disertakan.
          </p>
          ${btn('Unduh Backup JSON', 'backup', '', 'primary')}
          <p class="footer-note">
            Backup juga dapat dibuat melalui ekspor seluruh database pada phpMyAdmin. Lihat panduan migrasi
            untuk prosedur pemulihan.
          </p>
        </div>`,
      )}`
  );
}
