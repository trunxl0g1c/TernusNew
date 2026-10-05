// modules/receiving/actions.js
import { receiveForm } from './form.js';
export async function handleReceive(act, id, button) {
  receiveForm();
  return;
}
export const receivingActions = {
  receive: handleReceive,
};
