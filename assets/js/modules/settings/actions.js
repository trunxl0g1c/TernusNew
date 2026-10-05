// modules/settings/actions.js
import { api } from '../../core/api.js';
import { download } from '../../core/download.js';
import { dateNow } from '../../core/format.js';
export async function handleBackup(act, id, button) {
  const data = await api('backup');
  download(
    JSON.stringify(data, null, 2),
    'ternus-backup-' + dateNow() + '.json',
    'application/json',
  );
  return;
}
import { storageActions } from './storage.js';
export const settingsActions = {
  ...storageActions,
  backup: handleBackup,
};
