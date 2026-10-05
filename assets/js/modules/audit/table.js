// modules/audit/table.js
import { dt, e } from '../../core/format.js';
export function auditRow(r) {
  let info = '',
    acts = '',
    status = r.status || 'POSTED';
  return [dt(r.time), e(r.user), e(r.op), e(r.summary)];
}
