// components/fields.js
import { e } from '../core/format.js';
import { html } from '../core/html.js';
export function field(name, label, type = 'text', value = '', required = false, help = '') {
  return html`<div class="field">
    <label for="f-${e(name)}">${e(label)}${required ? ' *' : ''}</label
    ><input
      id="f-${e(name)}"
      name="${e(name)}"
      type="${type}"
      value="${e(value)}"
      ${required ? 'required' : ''}
      ${type === 'number' ? 'min="0" step="any"' : ''}
    />${help ? html`<small>${e(help)}</small>` : ''}
  </div>`;
}
export function select(name, label, options, value = '', required = true) {
  return html`<div class="field">
    <label for="f-${e(name)}">${e(label)}${required ? ' *' : ''}</label
    ><select id="f-${e(name)}" name="${e(name)}" ${options.entityType ? `data-create-type="${e(options.entityType)}"` : ''} ${required ? 'required' : ''}>
      <option value="">Pilih…</option>
      ${options
        .map(
          ([v, t]) =>
            html`<option value="${e(v)}" ${String(v) === String(value) ? 'selected' : ''}>
              ${e(t)}
            </option>`,
        )
        .join('')}
    </select>
  </div>`;
}
export const area = (name, label, v = '') =>
  html`<div class="field wide">
    <label>${e(label)}</label><textarea name="${e(name)}" rows="2">${e(v)}</textarea>
  </div>`;
export const check = (name, label, value = true) =>
  html`<div class="field">
    <label><input type="checkbox" name="${name}" ${value ? 'checked' : ''} /> ${e(label)}</label>
  </div>`;
