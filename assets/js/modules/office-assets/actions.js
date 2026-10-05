// modules/office-assets/actions.js
import { field, select } from '../../components/fields.js';
import { openForm, showDetail } from '../../components/modal.js';
import { table } from '../../components/ui.js';
import { mutate } from '../../core/api.js';
import { get, opts } from '../../core/data.js';
import { dateNow, dt, e } from '../../core/format.js';
import { html } from '../../core/html.js';
import { owner } from '../../core/permissions.js';
import { state } from '../../core/state.js';
export async function handleAssetNew(act, id, button) {
  openForm(
    'Tambah aset kantor',
    html`<div class="form-grid">
      ${field('name', 'Nama aset', 'text', '', true)}${field(
        'serial',
        'Serial number',
        'text',
      )}${field('date', 'Tanggal perolehan', 'date', dateNow(), true)}${field(
        'cost',
        'Biaya perolehan (Rp)',
        'number',
        0,
        true,
      )}${select('location', 'Lokasi', opts('locations'))}${field(
        'pic',
        'Penanggung jawab',
        'text',
        '',
        true,
      )}
    </div>`,
    (a) => mutate('asset.create', a),
  );
  return;
}
export async function handleAssetEvent(act, id, button) {
  const d = get('assets', id);
  openForm(
    'Tindakan · ' + d.name,
    html`<div class="form-grid">
      ${select('event', 'Tindakan', [
        ['loan', 'Pinjamkan'],
        ['return', 'Kembalikan'],
        ['move', 'Pindahkan'],
        ['maintenance', 'Mulai perawatan'],
        ['ready', 'Selesai perawatan'],
        ...(owner() ? [['retire', 'Hapuskan aset']] : []),
      ])}${field('pic', 'PIC / peminjam baru', 'text', d.pic)}${select(
        'location',
        'Lokasi baru',
        opts('locations'),
        d.location,
        false,
      )}${select(
        'condition',
        'Kondisi saat kembali',
        [
          ['Baik', 'Baik'],
          ['Rusak Ringan', 'Rusak ringan'],
          ['Rusak Berat', 'Rusak berat'],
        ],
        d.condition,
        false,
      )}${field('note', 'Catatan tindakan', 'text', '', true)}
    </div>`,
    (a) =>
      mutate('asset.event', {
        ...a,
        id,
      }),
  );
  return;
}
export async function handleAssetHistory(act, id, button) {
  showDetail(
    'Riwayat aset',
    table(
      ['Tanggal', 'Aksi', 'Petugas', 'Catatan'],
      state.data.asset_events
        .filter((x) => x.asset === id)
        .map((x) => [dt(x.date), e(x.event), e(x.by_name), e(x.note)]),
    ),
  );
  return;
}
export const officeAssetsActions = {
  'asset-new': handleAssetNew,
  'asset-event': handleAssetEvent,
  'asset-history': handleAssetHistory,
};
