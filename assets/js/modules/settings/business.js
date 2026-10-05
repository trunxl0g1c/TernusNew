import { area, select } from '../../components/fields.js';
import { e } from '../../core/format.js';
import { state } from '../../core/state.js';
import { owner } from '../../core/permissions.js';
import { mutate } from '../../core/api.js';
import { businessCatalog, businessConfig, updateModuleSelection } from '../../core/business.js';

export function businessSettingsPanel() {
  const catalog = businessCatalog();
  const config = businessConfig();
  return `<section class="panel business-panel">
    <div class="panel-head"><h3>Pengaturan Bisnis</h3></div>
    <div class="panel-body"><form id="business-form">
      <p>Pilih fitur sesuai kebutuhan usaha. Menonaktifkan modul tidak menghapus data.</p>
      <div class="form-grid">
        ${select('business_profile', 'Profil usaha', Object.entries(catalog.profiles).map(([key, profile]) => [key, profile.label]), config.profile)}
        <div class="field"><label>Template awal</label><button type="button" class="btn" id="business-preset">Terapkan preset ke pilihan di bawah</button>
        <small>Hanya mengisi pilihan form. Periksa lalu Simpan; produk dan lokasi lama tidak diganti.</small></div>
      </div>
      <h4>Modul aktif</h4>
      <p class="muted small">Dashboard, barang, stok, pelanggan, vendor, lokasi, kamus SKU, akun dan audit adalah fitur dasar yang tetap tersedia sesuai hak akses.</p>
      <div class="business-modules">
        ${Object.entries(catalog.modules).map(([key, module]) => {
          const count = key === 'packaging'
            ? (state.data.productions || []).filter((p) => p.kind === 'Pengemasan').length
            : module.pages.reduce((total, page) => total + (state.data[page]?.length || 0), 0);
          return `<label class="business-module"><input type="checkbox" data-business-module="${e(key)}" ${config.modules[key] !== false ? 'checked' : ''} />
            <span><strong>${e(module.label)}</strong><small>${module.depends.length ? 'Membutuhkan: ' + e(module.depends.map((id) => catalog.modules[id].label).join(', ')) : 'Dapat diatur sendiri'} · ${count} catatan tersimpan</small></span></label>`;
        }).join('')}
      </div>
      <p class="notice">Modul nonaktif dapat dibuka melalui “Riwayat modul nonaktif” dalam mode baca saja. Aktifkan kembali untuk melanjutkan transaksi yang belum selesai. Pilihan fitur yang saling bergantung akan disesuaikan bersama.</p>
      <div class="form-grid">
        ${area('business_stages', 'Kategori / tahap produk — satu pilihan per baris', config.stages.join('\n'))}
        ${area('business_processes', 'Jenis proses produksi — satu pilihan per baris', config.processes.join('\n'))}
      </div>
      <p class="muted small">Pengemasan ditambahkan melalui modul Pengemasan. Satuan saat ini tetap kg dan pcs; profil tidak mengubah satuan maupun saldo stok lama. Nama lokasi dapat diubah di menu Lokasi.</p>
      <p id="business-feedback" role="status" aria-live="polite"></p>
      <button class="btn primary" type="submit">Simpan Pengaturan Bisnis</button>
    </form></div></section>`;
}

export function bindBusinessSettings() {
  const form = document.querySelector('#business-form');
  if (!form || !owner()) return;
  const revision = businessConfig().revision;
  const feedback = form.querySelector('#business-feedback');
  const inputs = [...form.querySelectorAll('[data-business-module]')];
  const selection = () => Object.fromEntries(inputs.map((input) => [input.dataset.businessModule, input.checked]));
  const apply = (modules) => inputs.forEach((input) => { input.checked = modules[input.dataset.businessModule] === true; });
  inputs.forEach((input) => {
    input.onchange = () => {
      const next = updateModuleSelection(selection(), input.dataset.businessModule, input.checked);
      apply(next);
      feedback.textContent = 'Pilihan modul dan ketergantungannya diperbarui. Klik Simpan untuk menerapkan.';
    };
  });
  form.querySelector('#business-preset').onclick = () => {
    const preset = businessCatalog().profiles[form.elements.business_profile.value];
    if (!preset) return;
    apply(preset.modules);
    form.elements.business_stages.value = preset.stages.join('\n');
    form.elements.business_processes.value = preset.processes.join('\n');
    feedback.textContent = 'Preset diterapkan ke form. Periksa pilihan sebelum menyimpan.';
  };
  form.onsubmit = async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type=submit]');
    if (submit.disabled) return;
    const list = (name) => form.elements[name].value.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
    const payload = { profile: form.elements.business_profile.value, modules: selection(), stages: list('business_stages'), processes: list('business_processes'), revision };
    submit.disabled = true;
    feedback.textContent = 'Menyimpan pengaturan bisnis…';
    try {
      await mutate('business.settings', payload);
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  };
}
