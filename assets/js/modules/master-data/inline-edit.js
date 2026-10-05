import { mutate } from '../../core/api.js';
import { e, rup } from '../../core/format.js';
import { state } from '../../core/state.js';
import { toast } from '../../components/feedback.js';
import { buildInlinePayload, canInlineEdit, inlineSchemas, inlineValues } from './inline-schema.js';

let draft = null;
const refresh = () => window.dispatchEvent(new CustomEvent('ternus:state-changed'));
const editing = (id) => draft?.type === state.currentPage && draft?.record.id === id;
export const editedMasterId = () => draft?.type === state.currentPage ? draft.record.id : null;
export const masterEditable = () => canInlineEdit(state.currentPage, state.user?.role);

function focusField(field = 'name') {
  const input = document.querySelector('[data-inline-input="' + field + '"]') ||
    document.querySelector('[data-inline-input="name"]');
  input?.focus();
  if (input?.type !== 'number' && input?.type !== 'email') input?.select?.();
}

export function startMasterEdit(id, field = 'name') {
  if (!masterEditable()) return;
  if (draft && draft.type !== state.currentPage) draft = null;
  if (draft) {
    if (!editing(id)) toast('Simpan atau batalkan baris yang sedang diedit terlebih dahulu.');
    focusField(field);
    return;
  }
  const record = state.data[state.currentPage]?.find((r) => r.id === id);
  if (!record) return;
  draft = {
    type: state.currentPage,
    record: { ...record },
    values: inlineValues(state.currentPage, record),
    saving: false,
    error: '',
  };
  refresh();
  focusField(field);
}

export function masterCell(record, field) {
  const definition = inlineSchemas[state.currentPage]?.find((f) => f.key === field);
  const marker = field === 'name' ? 'data-master-row="' + e(record.id) + '"' : '';
  if (!editing(record.id) || !definition) {
    const value = definition?.type === 'number' ? rup(record[field]) : record[field];
    const display = field === 'name' ? '<strong>' + e(value) + '</strong>' : e(value);
    return '<span ' + marker + ' data-inline-field="' + e(field) + '"' +
      (field === 'address' ? ' class="inline-address"' : '') + '>' + display + '</span>';
  }
  const common = 'data-inline-input="' + field + '" aria-label="' + e(definition.label) + '" ' +
    (definition.required ? 'required ' : '') + (draft.saving ? 'disabled' : '');
  if (definition.options) {
    const current = draft.values[field];
    const options = [...new Set([...definition.options, current].filter(Boolean))];
    return '<span ' + marker + ' class="inline-cell"><select ' + common + '>' +
      options.map((value) => '<option value="' + e(value) + '" ' +
        (value === current ? 'selected' : '') + '>' + e(value) + '</option>').join('') +
      '</select></span>';
  }
  return '<span ' + marker + ' class="inline-cell"><input ' + common +
    ' type="' + (definition.type || 'text') + '" value="' + e(draft.values[field]) + '" ' +
    (definition.type === 'number' ? 'min="0" max="9007199254740991" step="1" ' : '') +
    (definition.max ? 'maxlength="' + definition.max + '"' : '') + ' /></span>';
}

export function masterEditActions(record, fallback) {
  if (!editing(record.id)) return fallback;
  const disabled = draft.saving ? 'disabled' : '';
  return '<div class="inline-actions" aria-busy="' + draft.saving + '"><div class="actions">' +
    '<button class="btn tiny primary" data-inline-save ' + disabled + '>' +
    (draft.saving ? 'Menyimpan…' : 'Simpan') + '</button>' +
    '<button class="btn tiny" data-inline-cancel ' + disabled + '>Batal</button></div>' +
    '<small class="inline-hint">Enter: simpan · Esc: batal</small>' +
    (draft.error ? '<span class="inline-error" role="alert">' + e(draft.error) + '</span>' : '') +
    '</div>';
}

function cancelMasterEdit() {
  if (!draft || draft.saving) return;
  draft = null;
  refresh();
}

async function saveMasterEdit() {
  if (!draft || draft.saving || !masterEditable() || draft.type !== state.currentPage) return;
  for (const input of document.querySelectorAll('[data-inline-input]')) {
    if (!input.reportValidity()) return;
  }
  const pending = draft;
  let payload;
  try {
    payload = buildInlinePayload(pending.type, pending.record, pending.values);
  } catch (error) {
    pending.error = error.message;
    refresh();
    focusField();
    return;
  }
  const baseline = inlineValues(pending.type, pending.record);
  if (inlineSchemas[pending.type].every((f) => String(payload[f.key]) === baseline[f.key])) {
    cancelMasterEdit();
    return;
  }
  pending.saving = true;
  pending.error = '';
  refresh();
  try {
    await mutate(pending.type === 'users' ? 'user.save' : 'master.save', payload, 'quick-edit');
    if (draft === pending) draft = null;
    refresh();
  } catch (error) {
    if (draft !== pending) return;
    pending.saving = false;
    pending.error = error.message || 'Gagal menyimpan. Coba lagi.';
    refresh();
    focusField();
  }
}

export function bindMasterInlineEdit() {
  if (!masterEditable() || (draft && draft.type !== state.currentPage)) draft = null;
  if (!masterEditable()) return;
  for (const marker of document.querySelectorAll('[data-master-row]')) {
    const row = marker.closest('tr');
    row.classList.add('master-editable-row');
    if (editing(marker.dataset.masterRow)) row.classList.add('master-editing-row');
    row.ondblclick = (event) => {
      if (event.target.closest('button, input, a, select, textarea')) return;
      const cell = event.target.closest('td');
      const field = cell?.querySelector('[data-inline-field]')?.dataset.inlineField || 'name';
      startMasterEdit(marker.dataset.masterRow, field);
    };
  }
  for (const input of document.querySelectorAll('[data-inline-input]')) {
    const update = () => {
      if (!draft || draft.saving) return;
      draft.values[input.dataset.inlineInput] = input.value;
      input.setCustomValidity('');
    };
    input.oninput = update;
    input.onchange = update;
    input.onkeydown = (event) => {
      if (event.isComposing) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        void saveMasterEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelMasterEdit();
      }
    };
  }
  const save = document.querySelector('[data-inline-save]');
  const cancel = document.querySelector('[data-inline-cancel]');
  if (save) save.onclick = () => void saveMasterEdit();
  if (cancel) cancel.onclick = cancelMasterEdit;
}
