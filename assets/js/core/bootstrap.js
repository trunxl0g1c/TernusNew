// core/bootstrap.js
import { api, load } from './api.js';
import { app } from './dom.js';
import { e } from './format.js';
import { html } from './html.js';
import { state } from './state.js';
import { auth } from '../modules/auth/view.js';
export async function boot() {
  if (location.protocol === 'file:') {
    app.innerHTML = html`<div class="boot">
      <h1>Buka melalui XAMPP</h1>
      <p>Salin folder ternus ke htdocs, aktifkan Apache dan MySQL, lalu buka:</p>
      <a class="btn primary" href="http://localhost/ternus/index.html"
        >http://localhost/ternus/index.html</a
      >
    </div>`;
    return;
  }
  try {
    const r = await api('status');
    state.csrfToken = r.csrf;
    if (r.authenticated && r.installed) await load();
    else auth(!r.installed);
  } catch (err) {
    app.innerHTML = html`<div class="boot">
      <h2>Belum dapat terhubung</h2>
      <p>${e(err.message)}</p>
      <button class="btn" onclick="location.reload()">Coba lagi</button>
    </div>`;
  }
}
