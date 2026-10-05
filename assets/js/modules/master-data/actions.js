// modules/master-data/actions.js
import { mutate } from '../../core/api.js';
import { state } from '../../core/state.js';
import { masterForm } from './form.js';
import { startMasterEdit } from './inline-edit.js';
export async function handleMasterNew(act, id, button) {
  masterForm(id);
  return;
}
export async function handleBulkArchive(act, id, button) {
  if (!state.selected.size) throw Error('Pilih minimal satu baris.');
  if (
    !confirm(
      'Proses ' + state.selected.size + ' data terpilih? Data bersejarah tidak dapat dihapus.',
    )
  )
    return;
  await mutate('master.bulk', {
    type: state.currentPage,
    action: act.slice(5),
    ids: [...state.selected],
  });
  state.selected.clear();
  return;
}
export const masterDataActions = {
  'master-new': handleMasterNew,
  'master-edit': handleMasterNew,
  'quick-edit': (act, id) => startMasterEdit(id),
  'bulk-archive': handleBulkArchive,
  'bulk-restore': handleBulkArchive,
  'bulk-delete': handleBulkArchive,
};
