// modules/sales/actions.js
import { mutate } from '../../core/api.js';
import { saleForm } from './form.js';
export async function handleSaleQuote(act, id, button) {
  saleForm(act === 'sale-quote');
  return;
}
export async function handleQuoteAccept(act, id, button) {
  const ops = {
    'quote-accept': 'quote.accept',
    'quote-convert': 'quote.convert',
    'order-confirm': 'order.confirm',
    'order-cancel': 'order.cancel',
  };
  if (!confirm('Lanjutkan ' + button.textContent + '? Perubahan akan langsung disimpan.')) return;
  await mutate(ops[act], {
    id,
  });
  return;
}
export const salesActions = {
  'sale-quote': handleSaleQuote,
  'sale-order': handleSaleQuote,
  'quote-accept': handleQuoteAccept,
  'quote-convert': handleQuoteAccept,
  'order-confirm': handleQuoteAccept,
  'order-cancel': handleQuoteAccept,
};
