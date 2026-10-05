// modules/master-data/page.js
import { filtered, header, toolbar } from '../../components/page.js';
import { btn, table } from '../../components/ui.js';
import { e, rup } from '../../core/format.js';
import { html } from '../../core/html.js';
import { admin } from '../../core/permissions.js';
import { state } from '../../core/state.js';
import { titles } from '../../layout/navigation.js';
import { editedMasterId, masterCell, masterEditActions, masterEditable } from './inline-edit.js';
export function masterPage() {
  const type = state.currentPage;
  const editable = masterEditable();
  const rows = filtered(state.data[type].filter((x) => state.showArchived || x.active));
  state.exportHeads = ['Nama', 'SKU/Kode', 'Status'];
  state.exportRows = rows.map((x) => [
    x.name,
    x.sku || x.code || x.email || '',
    x.active ? 'Aktif' : 'Arsip',
  ]);
  // Keep the draft visible, without including it in filtered CSV exports/counts.
  let visibleRows = rows.slice(0, 150);
  if (editable && editedMasterId()) {
    const active = state.data[type].find((r) => r.id === editedMasterId());
    if (active && !visibleRows.some((r) => r.id === active.id)) {
      visibleRows = [active, ...visibleRows.slice(0, 149)];
    }
  }
  let heads = ['<input type="checkbox" id="select-all" aria-label="Pilih seluruh hasil">', 'Nama'];
  if (type === 'products') {
    heads.push('SKU', 'Tahap', 'Satuan', 'Harga jual');
    if (editable) heads.push('Harga dasar');
  }
  else if (type === 'terms') heads.push('Kode');
  else if (type === 'users') heads.push('Email', 'Role');
  else if (['customers', 'suppliers'].includes(type)) heads.push('Tipe', 'Kontak', 'Alamat');
  heads.push('Status', 'Aksi');
  return (
    header(
      titles[type],
      'Master data untuk transaksi yang konsisten.',
      editable ? btn('+ Tambah', 'master-new', '', 'primary') : '',
    ) +
    html`<section class="panel">
      ${toolbar(
        html`<label class="small"
          ><input type="checkbox" id="archive-toggle" ${state.showArchived ? 'checked' : ''} />
          Tampilkan arsip</label
        >`,
      )}${admin() && type !== 'users'
        ? html`<div class="toolbar">
            <span class="count">Aksi pada data terpilih</span>${btn(
              'Arsipkan',
              'bulk-archive',
              '',
              'tiny',
            )}${btn('Aktifkan', 'bulk-restore', '', 'tiny')}${btn(
              'Hapus',
              'bulk-delete',
              '',
              'tiny danger',
            )}
          </div>`
        : ''}${editable ? html`<div class="toolbar"><span class="count">Klik dua kali baris untuk Quick Edit. Tab: pindah kolom · Enter: simpan · Esc: batal. Simpan sebelum pindah menu.</span></div>` : ''}${table(
        heads,
        visibleRows.map((r) => {
          let cells = [
            html`<input
              type="checkbox"
              data-select="${e(r.id)}"
              ${state.selected.has(r.id) ? 'checked' : ''}
              aria-label="Pilih ${e(r.name)}"
            />`,
            editable ? masterCell(r, 'name') : html`<strong>${e(r.name)}</strong>`,
          ];
          if (type === 'products') {
            cells.push(e(r.sku), e(r.stage), e(r.unit), editable ? masterCell(r, 'price') : rup(r.price));
            if (editable) cells.push(masterCell(r, 'cost'));
          }
          else if (type === 'terms') cells.push(editable ? masterCell(r, 'code') : e(r.code));
          else if (type === 'users') cells.push(...['email', 'role'].map((key) => editable ? masterCell(r, key) : e(r[key])));
          else if (['customers', 'suppliers'].includes(type)) cells.push(...['kind', 'phone', 'address'].map((key) => editable ? masterCell(r, key) : e(r[key])));
          cells.push(
            html`<span class="badge ${r.active ? 'good' : ''}"
              >${r.active ? 'Aktif' : 'Arsip'}</span
            >`,
            editable
              ? html`<div class="actions">
                  ${btn('Edit Detail', 'master-edit', r.id, 'tiny')}${btn('Quick Edit', 'quick-edit', r.id, 'tiny')}
                </div>`
              : '—',
          );
          if (editable) cells[cells.length - 1] = masterEditActions(r, cells[cells.length - 1]);
          if (admin() && editedMasterId() !== r.id) cells[cells.length - 1] += btn('Log aktivitas', 'audit-record', r.id, 'tiny');
          return cells;
        }),
      )}
      <div class="pagination">
        ${Math.min(rows.length, 150)} dari ${rows.length} hasil. Gunakan pencarian untuk
        mempersempit daftar.
      </div>
    </section>`
  );
}
