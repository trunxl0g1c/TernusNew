// core/api.js
import { toast } from '../components/feedback.js';
import { state } from './state.js';
export async function api(action, data) {
  const res = await fetch('api.php?action=' + action, {
    method: data ? 'POST' : 'GET',
    headers: data
      ? {
          'Content-Type': 'application/json',
          'X-CSRF-Token': state.csrfToken,
        }
      : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'same-origin',
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw Error(
      'PHP belum berjalan. Buka melalui http://localhost/ternus/, bukan klik file langsung.',
    );
  }
  if (!res.ok) throw Error(json.error || 'Permintaan gagal.');
  return json;
}
export const keys = new Map();
export async function mutate(op, data, source = 'form') {
  const token = JSON.stringify([op, data]);
  if (!keys.has(token))
    keys.set(token, crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
  const r = await api('mutate', {
    op,
    data,
    source,
    key: keys.get(token),
  });
  await load();
  keys.delete(token);
  toast(r.result.message);
  return r.result;
}
export async function load() {
  const r = await api('state');
  state.data = r.state;
  state.storage = r.storage || null;
  state.user = r.user;
  state.csrfToken = r.csrf;
  window.dispatchEvent(new CustomEvent('ternus:state-changed'));
}
