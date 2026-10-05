import assert from 'node:assert/strict';
import fs from 'node:fs';
import { state } from '../assets/js/core/state.js';
import { actionEnabled, businessConfig, moduleEnabled, pageEnabled, productionKinds, updateModuleSelection } from '../assets/js/core/business.js';
import { btn } from '../assets/js/components/ui.js';
import { businessSettingsPanel } from '../assets/js/modules/settings/business.js';
import { dashboard } from '../assets/js/modules/dashboard/page.js';
import { allowed } from '../assets/js/core/permissions.js';

const catalog = JSON.parse(fs.readFileSync(new URL('../app/business-catalog.json', import.meta.url)));
const modules = Object.keys(catalog.modules);
const fresh = () => {
  state.data = { settings: { company: 'Test Company' }, business_catalog: catalog };
  for (const key of ['invoices', 'shipments', 'productions', 'products', 'audit', 'locations', 'stock']) state.data[key] = [];
  state.user = { name: 'Owner', role: 'owner' };
};
fresh();
for (const key of modules) assert.equal(moduleEnabled(key), true, 'Legacy default: ' + key);
assert.equal(businessConfig().profile, 'coffee');
assert.ok(productionKinds().includes('Roasting'));
assert.ok(productionKinds().includes('Pengemasan'));

// Validate the canonical registry: no cycles, missing prerequisites, duplicated pages/actions/commands.
for (const key of modules) {
  const visit = (id, path = []) => {
    assert.ok(catalog.modules[id], 'Unknown dependency');
    assert.ok(!path.includes(id), 'Cyclic module dependency');
    catalog.modules[id].depends.forEach((dep) => visit(dep, [...path, id]));
  };
  visit(key);
}
for (const field of ['pages', 'actions', 'commands']) {
  const all = Object.values(catalog.modules).flatMap((m) => m[field]);
  assert.equal(new Set(all).size, all.length, 'Duplicate registry entry: ' + field);
}
const commands = [...fs.readFileSync(new URL('../app/commands.php', import.meta.url), 'utf8').matchAll(/'([^']+)'\s*=>/g)].map((m) => m[1]);
const core = ['settings', 'business.settings', 'master.save', 'master.bulk', 'user.save'];
assert.deepEqual(new Set(commands), new Set([...core, ...Object.values(catalog.modules).flatMap((m) => m.commands)]));

for (const [profile, preset] of Object.entries(catalog.profiles)) {
  assert.deepEqual(Object.keys(preset.modules).sort(), [...modules].sort());
  for (const key of modules) {
    if (preset.modules[key]) assert.ok(moduleEnabled(key, preset.modules), profile + ': incomplete prerequisites');
  }
}
const allOn = { ...catalog.profiles.coffee.modules };
let selection = updateModuleSelection(allOn, 'production', false);
assert.equal(selection.packaging, false);
selection = updateModuleSelection(selection, 'packaging', true);
assert.equal(selection.production, true);
selection = updateModuleSelection(allOn, 'sales', false);
for (const key of ['sales', 'quotes', 'shipping', 'invoicing', 'payments', 'returns']) assert.equal(selection[key], false);
selection = updateModuleSelection(selection, 'payments', true);
for (const key of ['payments', 'invoicing', 'sales']) assert.equal(selection[key], true);
assert.equal(selection.shipping, false);
assert.deepEqual(allOn, catalog.profiles.coffee.modules, 'Selection must not mutate saved defaults');

for (const [key, definition] of Object.entries(catalog.modules)) {
  fresh();
  state.data.settings.business = { modules: updateModuleSelection(allOn, key, false) };
  for (const page of definition.pages) assert.equal(pageEnabled(page), false);
  for (const action of definition.actions) {
    assert.equal(actionEnabled(action), false);
    assert.equal(btn('Blocked', action), '');
  }
  for (const action of ['record-detail', 'production-detail', 'print-invoice', 'print-quote', 'invoice-history', 'asset-history', 'export', 'backup']) {
    assert.equal(actionEnabled(action), true, 'History action blocked: ' + action);
  }
  assert.ok(pageEnabled('products'));
  assert.ok(pageEnabled('settings'));
}
fresh();
state.data.productions = [{ id: 'pkg', kind: 'Pengemasan' }, { id: 'roast', kind: 'Roasting' }];
state.data.settings.business = { modules: { ...allOn, packaging: false } };
assert.equal(actionEnabled('production-complete', 'pkg'), false);
assert.equal(actionEnabled('production-complete', 'roast'), true);
assert.ok(!productionKinds().includes('Pengemasan'));

fresh();
state.data.settings.business = { ...catalog.profiles.retail, profile: 'retail', revision: 2 };
const snapshot = JSON.stringify(state.data);
const page = businessSettingsPanel();
assert.equal((page.match(/data-business-module=/g) || []).length, modules.length);
assert.ok(page.includes('Pengaturan Bisnis'));
assert.ok(!dashboard().includes('Pantau perjalanan kopi'));
assert.ok(!dashboard().includes('Proses berjalan'));
assert.ok(dashboard().includes('Stok per lokasi'));
assert.equal(JSON.stringify(state.data), snapshot, 'Rendering must not mutate saved data');
state.user.role = 'admin'; assert.equal(allowed('settings'), false); assert.equal(allowed('users'), false);
state.user.role = 'sales'; assert.equal(allowed('settings'), false); assert.equal(allowed('orders'), true);
console.log('PASS: legacy defaults, 12 module definitions, five presets, dependency cascades, command coverage, hidden actions, readable history, packaging gate, settings rendering and role gates.');
