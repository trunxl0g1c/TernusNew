// core/html.js
export function html(strings, ...values) {
  return strings.reduce(
    (result, part, i) => result + part + (i < values.length ? values[i] : ''),
    '',
  );
}
