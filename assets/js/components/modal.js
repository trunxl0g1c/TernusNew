import { html } from '../core/html.js';
// components/modal.js
import { btn } from './ui.js';
import { modal } from '../core/dom.js';
import { e } from '../core/format.js';
import { state } from '../core/state.js';
export function openForm(title, contentMarkup, onSubmit, button = 'Simpan', options = {}) {
  const target = options.dialog || modal;
  target.innerHTML = html`<form id="modal-form">
    <div class="modal-head">
      <h2>${e(title)}</h2>
      ${btn('✕', 'close', '', 'quiet')}
    </div>
    <div class="modal-body">
      ${contentMarkup}
      <div id="form-error" class="form-error"></div>
    </div>
    <div class="modal-foot">
      ${btn('Kembali', 'close')}<button class="btn primary" type="submit">${e(button)}</button>
    </div>
  </form>`;
  target.showModal();
  const form = target.querySelector('form');
  // Nested dialogs must not duplicate the IDs of their parent form fields.
  if (target !== modal) {
    form.removeAttribute('id');
    form.querySelector('#form-error').removeAttribute('id');
    for (const input of form.querySelectorAll('[id]')) {
      const old = input.id; input.id = target.id + '-' + old;
      for (const label of form.querySelectorAll('label')) if (label.htmlFor === old) label.htmlFor = input.id;
    }
  }
  const errors = form.querySelector('.form-error');
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    if (state.busy) return;
    state.busy = true;
    const b = ev.target.querySelector('[type=submit]');
    b.disabled = true;
    errors.innerHTML = '';
    try {
      const result = await onSubmit(Object.fromEntries(new FormData(ev.target)), ev.target);
      await options.onSaved?.(result);
      target.close();
    } catch (err) {
      errors.innerHTML = html`<div class="error">
        ${e(err.message)}
      </div>`;
    } finally {
      b.disabled = false;
      state.busy = false;
    }
  };
  return form;
}
export function showDetail(title, contentMarkup, print = false) {
  modal.innerHTML = html`<div class="modal-head">
      <h2>${e(title)}</h2>
      ${btn('✕', 'close', '', 'quiet')}
    </div>
    <div class="modal-body">${contentMarkup}</div>
    <div class="modal-foot">
      ${btn('Tutup', 'close')}${print ? btn('Cetak / Simpan PDF', 'print', '', 'primary') : ''}
    </div>`;
  modal.showModal();
}
