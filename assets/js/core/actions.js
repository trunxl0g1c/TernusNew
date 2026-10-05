// core/actions.js
import { commonActions } from '../components/actions.js';
import { authActions } from '../modules/auth/actions.js';
import { invoicesActions } from '../modules/invoices/actions.js';
import { masterDataActions } from '../modules/master-data/actions.js';
import { officeAssetsActions } from '../modules/office-assets/actions.js';
import { paymentsActions } from '../modules/payments/actions.js';
import { productionActions } from '../modules/production/actions.js';
import { receivingActions } from '../modules/receiving/actions.js';
import { returnsActions } from '../modules/returns/actions.js';
import { salesActions } from '../modules/sales/actions.js';
import { settingsActions } from '../modules/settings/actions.js';
import { shippingActions } from '../modules/shipping/actions.js';
import { stockActions } from '../modules/stock/actions.js';
import { stocktakesActions } from '../modules/stocktakes/actions.js';
import { transfersActions } from '../modules/transfers/actions.js';
import { actionEnabled } from './business.js';
import { auditActions } from '../modules/audit/page.js';
export async function action(act, id, button) {
  if (!actionEnabled(act, id)) throw Error('Modul nonaktif. Aktifkan kembali di Pengaturan Bisnis.');
  const handler = actionHandlers[act];
  if (!handler) throw Error('Tindakan tidak dikenal: ' + act);
  await handler(act, id, button);
}
export const actionHandlers = {
  ...auditActions,
  ...commonActions,
  ...authActions,
  ...stockActions,
  ...masterDataActions,
  ...settingsActions,
  ...receivingActions,
  ...productionActions,
  ...transfersActions,
  ...salesActions,
  ...invoicesActions,
  ...stocktakesActions,
  ...returnsActions,
  ...shippingActions,
  ...paymentsActions,
  ...officeAssetsActions,
};
