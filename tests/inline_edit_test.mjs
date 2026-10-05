// Node-only frontend tests with a minimal DOM/API harness; no live database writes.
import assert from 'node:assert/strict';
import { state } from '../assets/js/core/state.js';
import { startMasterEdit, masterCell, masterEditActions, bindMasterInlineEdit } from '../assets/js/modules/master-data/inline-edit.js';
import { inlineSchemas, inlineValues, canInlineEdit, buildInlinePayload } from '../assets/js/modules/master-data/inline-schema.js';
import { masterPage } from '../assets/js/modules/master-data/page.js';

const records = {
  products: { id: 'p1', name: 'Cherry', sku: 'CHR', stage: 'Cherry', unit: 'kg', price: 25000, cost: 20000, active: true, version: 3, sell: false, process: true, net_g: 0, minimum: 7 },
  customers: { id: 'c1', name: 'Pelanggan', kind: 'Retail', phone: '081234', address: 'Bandung', active: true, version: 4 },
  suppliers: { id: 's1', name: 'Vendor', kind: 'Petani', phone: '081111', address: 'Lembang', active: true, version: 5 },
  locations: { id: 'l1', name: 'Gudang', active: true, version: 6 },
  terms: { id: 't1', name: 'Natural', code: 'NAT', active: true, version: 7 },
  users: { id: 'u1', name: 'Admin', email: 'admin@example.com', role: 'admin', active: false, password: 'never-send-this' },
};
const calls = [];
let inputs = {}, save = {}, cancel = {}, fail = false;
const toast = { style: {}, textContent: '' };
globalThis.window = new EventTarget();
globalThis.document = {
  querySelector(selector) {
    if (selector === '#toast') return toast;
    if (selector === '[data-inline-save]') return save;
    if (selector === '[data-inline-cancel]') return cancel;
    return inputs[selector.match(/data-inline-input="(\w+)"/)?.[1]] ?? null;
  },
  querySelectorAll(selector) { return selector === '[data-inline-input]' ? Object.values(inputs) : []; },
};
state.user = { id: 'owner', name: 'Owner', role: 'owner' };
state.data = Object.fromEntries(Object.entries(records).map(([type, record]) => [type, [record]]));
function render() {
  inputs = {};
  const type = state.currentPage;
  const record = records[type];
  for (const definition of inlineSchemas[type] || []) {
    const markup = masterCell(record, definition.key);
    if (!markup.includes('data-inline-input=')) continue;
    const value = definition.options
      ? markup.match(/<option value="([^"]*)" selected/)?.[1]
      : markup.match(/value="([^"]*)"/)?.[1];
    inputs[definition.key] = {
      type: definition.type || 'text', dataset: { inlineInput: definition.key }, value,
      focus() {}, select() {}, setCustomValidity() {}, reportValidity() { return true; },
    };
  }
  save = {}; cancel = {}; bindMasterInlineEdit();
}
window.addEventListener('ternus:state-changed', render);
globalThis.fetch = async (url, options) => {
  if (url.includes('mutate')) {
    const body = JSON.parse(options.body); calls.push(body);
    if (fail) return { ok: false, json: async () => ({ error: 'Konflik versi' }) };
    const type = body.op === 'user.save' ? 'users' : body.data.type;
    records[type] = { ...records[type], ...body.data };
    if (type !== 'users') records[type].version++;
    state.data[type] = [records[type]];
    return { ok: true, json: async () => ({ result: { message: 'Data tersimpan.' } }) };
  }
  return { ok: true, json: async () => ({ state: state.data, user: state.user, csrf: 'test' }) };
};
const fill = (field, value) => { inputs[field].value = value; inputs[field].oninput(); };
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const edits = {
  products: { name: 'Cherry Baru', price: '28000', cost: '21000' },
  customers: { name: 'Pelanggan Baru', kind: 'Reseller', phone: '08999', address: 'Jakarta' },
  suppliers: { name: 'Vendor Baru', kind: 'Vendor', phone: '', address: '' },
  locations: { name: 'Gudang Baru' },
  terms: { name: 'Natural Baru', code: 'nat-2' },
  users: { name: 'Admin Baru', email: 'NEW@example.com', role: 'sales' },
};

for (const type of Object.keys(inlineSchemas)) {
  state.currentPage = type; state.showArchived = true; render();
  const before = { ...records[type] };
  assert.match(masterPage(), /data-act="quick-edit"/);
  startMasterEdit(before.id);
  assert.equal(Object.keys(inputs).length, inlineSchemas[type].length, type);
  for (const [field, value] of Object.entries(edits[type])) fill(field, value);
  inputs.name.onkeydown({ key: 'Enter', preventDefault() {} }); await flush();
  const payload = calls.at(-1).data;
  assert.equal(calls.at(-1).op, type === 'users' ? 'user.save' : 'master.save');
  assert.equal(Object.keys(inputs).length, 0);
  assert.equal(payload.name, edits[type].name);
  if (type !== 'users') assert.equal(payload.version, before.version);
  if (type === 'products') {
    assert.equal(payload.sell, false); assert.equal(payload.minimum, 7);
    assert.equal(payload.price, 28000); assert.equal(payload.cost, 21000); assert.equal(payload.sku, 'CHR');
  }
  if (type === 'users') {
    assert.equal(payload.active, false); assert.equal(payload.email, 'new@example.com');
    assert.equal(payload.role, 'sales'); assert.ok(!Object.hasOwn(payload, 'password'));
  }
  if (type === 'terms') assert.equal(payload.code, 'NAT-2');
  const count = calls.length;
  startMasterEdit(before.id); fill('name', 'Cancel');
  inputs.name.onkeydown({ key: 'Escape', preventDefault() {} });
  assert.equal(calls.length, count); assert.equal(records[type].name, edits[type].name);
  startMasterEdit(before.id); save.onclick(); await flush();
  assert.equal(calls.length, count, 'Unchanged row must not send a request');
}

state.currentPage = 'customers'; render(); startMasterEdit(records.customers.id);
fill('name', 'Retry'); fail = true; save.onclick(); await flush();
assert.equal(inputs.name.value, 'Retry'); assert.match(masterEditActions(records.customers, ''), /Konflik versi/);
fail = false; save.onclick(); await flush();
assert.equal(calls.at(-1).key, calls.at(-2).key); assert.equal(records.customers.name, 'Retry');
startMasterEdit(records.customers.id); fill('name', '<img onerror="bad">');
assert.match(masterCell(records.customers, 'name'), /&lt;img/); cancel.onclick();

for (const role of ['owner', 'admin', 'sales', 'unknown', undefined]) {
  state.user.role = role;
  for (const type of Object.keys(inlineSchemas)) {
    state.currentPage = type; render(); startMasterEdit(records[type].id); render();
    const expected = role === 'owner' || (role === 'admin' && type !== 'users') || (role === 'sales' && type === 'customers');
    assert.equal(canInlineEdit(type, role), expected, role + ':' + type);
    assert.equal(Object.keys(inputs).length > 0, expected);
    assert.equal(masterPage().includes('data-master-row='), expected);
    if (expected) cancel.onclick();
  }
}
state.user.role = 'owner'; state.currentPage = 'customers'; render();
startMasterEdit(records.customers.id); state.searchQuery = 'no-match-at-all';
assert.match(masterPage(), /data-inline-input/); assert.equal(state.exportRows.length, 0);
state.searchQuery = ''; cancel.onclick();
assert.throws(() => buildInlinePayload('products', records.products, { ...inlineValues('products', records.products), price: '-1' }));
assert.throws(() => buildInlinePayload('locations', records.locations, { name: '   ' }));
assert.throws(() => buildInlinePayload('terms', records.terms, { name: 'Test', code: 'BAD CODE' }));
assert.throws(() => buildInlinePayload('users', records.users, { name: 'Test', email: 'invalid', role: 'admin' }));
console.log('PASS: six master modules; role matrix; payload/version preservation; user password exclusion; Enter/Escape; unchanged saves; failed save/retry; escaping; filtered editor; validation. DOM/API simulated, not browser/PHP integration.');
process.exit(0);
