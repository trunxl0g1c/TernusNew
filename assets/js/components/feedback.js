// components/feedback.js
export let toastTimer;
export function toast(t) {
  const el = document.querySelector('#toast');
  el.textContent = t;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.style.display = 'none'), 6500);
}
