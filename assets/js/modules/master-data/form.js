import { html } from '../../core/html.js';
// modules/master-data/form.js
import { area, check, field, select } from '../../components/fields.js';
import { openForm } from '../../components/modal.js';
import { mutate } from '../../core/api.js';
import { get } from '../../core/data.js';
import { state } from '../../core/state.js';
import { titles } from '../../layout/navigation.js';
import { businessConfig } from '../../core/business.js';
export function masterForm(id, context = {}) {
  const open = context.open || openForm;
  const type = context.type || state.currentPage,
    r = id ? get(type, id) : (context.initial || {});
  let contentMarkup = '';
  if (type === 'users') {
    contentMarkup = html`<div class="form-grid">
      ${field('name', 'Nama', 'text', r.name || '', true)}${field(
        'email',
        'Email',
        'email',
        r.email || '',
        true,
      )}${field(
        'password',
        id ? 'Password baru (kosong jika tetap)' : 'Password minimal 10 karakter',
        'password',
        '',
        !id,
      )}${select(
        'role',
        'Hak akses',
        [
          ['owner', 'Owner'],
          ['admin', 'Admin'],
          ['sales', 'Sales'],
        ],
        r.role || 'admin',
      )}${check('active', 'Akun aktif', r.active !== false)}
    </div>`;
    open(id ? 'Edit pengguna' : 'Tambah pengguna', contentMarkup, (a) =>
      mutate('user.save', {
        ...a,
        ...(id
          ? {
              id,
            }
          : {}),
        active: a.active === 'on',
      }),
    );
    return;
  }
  contentMarkup = html`<div class="form-grid">
    ${field('name', 'Nama', 'text', r.name || '', true)}
  </div>`;
  if (type === 'products')
    contentMarkup +=
      field(
        'sku',
        'SKU',
        'text',
        r.sku || '',
        true,
        'Kode otomatis dapat ditinjau sebelum disimpan.',
      ) +
      select(
        'unit',
        'Satuan jual / input',
        [
          ['kg', 'kg (stok dasar gram)'],
          ['pcs', 'pcs'],
        ],
        r.unit || 'kg',
      ) +
      select(
        'stage',
        'Kategori / tahap',
        [
          ...new Set([
            ...businessConfig().stages,
            ...state.data.products.map((x) => x.stage),
          ]),
        ].map((x) => [x, x]),
        r.stage || businessConfig().stages[0] || '',
      ) +
      field('cost', 'Harga dasar per satuan', 'number', r.cost || 0, true) +
      field('price', 'Harga jual per satuan', 'number', r.price || 0, true) +
      field(
        'net_g',
        'Berat isi per pcs (gram)',
        'number',
        r.net_g || 0,
        false,
        'Untuk produk kemasan. Isi 0 untuk alat/pouch kosong.',
      ) +
      check('sell', 'Boleh dijual', r.sell !== false) +
      check('process', 'Boleh diproses', r.process !== false);
  if (['customers', 'suppliers'].includes(type))
    contentMarkup +=
      field('phone', 'Nomor HP', 'text', r.phone || '') +
      select(
        'kind',
        'Jenis',
        type === 'customers'
          ? ['Retail', 'Reseller', 'Partnership', 'Employee'].map((x) => [x, x])
          : ['Petani', 'Vendor', 'Lainnya'].map((x) => [x, x]),
        r.kind || (type === 'customers' ? 'Retail' : 'Vendor'),
      ) +
      area('address', 'Alamat', r.address || '');
  if (type === 'terms') contentMarkup += field('code', 'Kode SKU', 'text', r.code || '', true);
  const form = open(id ? 'Edit Detail' : 'Tambah ' + titles[type], contentMarkup, async (a) =>
    mutate('master.save', {
      ...r,
      ...a,
      type,
      sell: a.sell === 'on',
      process: a.process === 'on',
      ...(id
        ? {
            id,
            version: r.version,
          }
        : {}),
    }),
  );
  if (type === 'products' && !id) {
    const n = form.querySelector('[name=name]'),
      sku = form.querySelector('[name=sku]');
    let manual = false;
    sku.oninput = () => (manual = true);
    n.oninput = () => {
      if (manual) return;
      let text = n.value;
      const codes = [];
      [...state.data.terms]
        .filter((t) => t.active)
        .sort((a, b) => b.name.length - a.name.length)
        .forEach((t) => {
          if (text.toLowerCase().includes(t.name.toLowerCase())) {
            codes.push(t.code);
            text = text.replace(new RegExp(t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '');
          }
        });
      const size = n.value.match(/\b(\d+)\s*(gr|g|kg)\b/i);
      if (size) codes.push(size[1]);
      sku.value = codes.length
        ? codes.join('-')
        : n.value
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);
    };
  }
}
