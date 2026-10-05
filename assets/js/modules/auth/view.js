// modules/auth/view.js
import { toast } from '../../components/feedback.js';
import { field } from '../../components/fields.js';
import { notice } from '../../components/ui.js';
import { api, load } from '../../core/api.js';
import { app } from '../../core/dom.js';
import { e } from '../../core/format.js';
import { html } from '../../core/html.js';
import { state } from '../../core/state.js';
export function auth(setup = false) {
  app.innerHTML = html`<div class="auth">
    <section class="auth-story">
      <div class="brandmark">T</div>
      <h1>Dari kebun,<br />hingga pelanggan.</h1>
      <p>Satu ruang kerja untuk perjalanan kopi, pergerakan stok, dan penjualan Teras Nusantara.</p>
      <div class="tag">Inventory · Production · Sales</div>
    </section>
    <section class="auth-form">
      <form class="auth-card" id="auth-form">
        <div class="eyebrow">TERAS NUSANTARA</div>
        <h2>${setup ? 'Siapkan ruang kerja Anda' : 'Selamat datang kembali'}</h2>
        <p class="muted">
          ${setup
            ? 'Database dibuat otomatis. Daftarkan akun owner pertama.'
            : 'Masuk untuk melanjutkan aktivitas operasional.'}
        </p>
        ${setup
          ? notice(
              'Instalasi dilakukan satu kali dari localhost. Pastikan MySQL aktif. Jika kredensial berbeda, edit server/config.php.',
            ) + field('name', 'Nama owner', 'text', '', true)
          : ''}${field('email', 'Email', 'email', '', true)}${field(
          'password',
          'Password',
          'password',
          '',
          true,
        )}
        <div id="auth-error"></div>
        <button class="btn primary" type="submit">${setup ? 'Pasang aplikasi' : 'Masuk'} →</button>
        <p class="footer-note">
          ${setup
            ? 'Password minimal 10 karakter. Tidak ada akun atau password bawaan.'
            : 'Data tersimpan pada database MySQL komputer/server XAMPP Anda.'}
        </p>
      </form>
    </section>
  </div>`;
  document.querySelector('#auth-form').onsubmit = async (ev) => {
    ev.preventDefault();
    const b = ev.target.querySelector('button');
    b.disabled = true;
    try {
      const r = await api(setup ? 'setup' : 'login', Object.fromEntries(new FormData(ev.target)));
      if (setup) {
        toast(r.message);
        auth(false);
      } else {
        state.csrfToken = r.csrf;
        await load();
      }
    } catch (err) {
      document.querySelector('#auth-error').innerHTML = html`<div class="error">
        ${e(err.message)}
      </div>`;
    } finally {
      b.disabled = false;
    }
  };
}
