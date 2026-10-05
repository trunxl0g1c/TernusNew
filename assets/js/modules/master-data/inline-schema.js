// Editable master fields; business permissions are also enforced by the server.
const name = { key: 'name', label: 'Nama', required: true, max: 100 };
const money = (key, label) => ({ key, label, type: 'number', required: true });
const choices = (key, label, options) => ({ key, label, options, required: true });
const contact = (kinds) => [
  name,
  choices('kind', 'Tipe', kinds),
  { key: 'phone', label: 'Kontak', type: 'tel', max: 50 },
  { key: 'address', label: 'Alamat', max: 500 },
];

export const inlineSchemas = {
  products: [name, money('price', 'Harga jual'), money('cost', 'Harga dasar')],
  customers: contact(['Retail', 'Reseller', 'Partnership', 'Employee']),
  suppliers: contact(['Petani', 'Vendor', 'Lainnya']),
  locations: [name],
  terms: [name, { key: 'code', label: 'Kode SKU', required: true, max: 40 }],
  users: [
    name,
    { key: 'email', label: 'Email', type: 'email', required: true, max: 100 },
    choices('role', 'Role', ['owner', 'admin', 'sales']),
  ],
};

export function canInlineEdit(type, role) {
  if (!inlineSchemas[type]) return false;
  if (type === 'users') return role === 'owner';
  return ['owner', 'admin'].includes(role) || (type === 'customers' && role === 'sales');
}

export function inlineValues(type, record) {
  return Object.fromEntries(inlineSchemas[type].map((field) => [
    field.key,
    String(record[field.key] ?? (field.type === 'number' ? 0 : '')),
  ]));
}

export function buildInlinePayload(type, record, draftValues) {
  const fields = inlineSchemas[type];
  if (!fields) throw Error('Jenis master tidak mendukung Quick Edit.');
  const values = {};
  for (const field of fields) {
    const text = String(draftValues[field.key] ?? '').trim();
    if (field.required && !text) throw Error(`${field.label} wajib diisi.`);
    if (field.max && text.length > field.max) throw Error(`${field.label} maksimal ${field.max} karakter.`);
    if (field.type === 'number') {
      const number = Number(text);
      if (!Number.isSafeInteger(number) || number < 0) throw Error(`${field.label} harus berupa rupiah bulat, minimal 0.`);
      values[field.key] = number;
    } else values[field.key] = text;
    if (field.options && !field.options.includes(text) && text !== record[field.key]) throw Error(`${field.label} tidak valid.`);
  }
  if (type === 'terms') {
    values.code = values.code.toUpperCase();
    if (!/^[A-Z0-9-]+$/.test(values.code)) throw Error('Kode SKU hanya huruf, angka, atau tanda minus.');
  }
  if (type === 'users') {
    values.email = values.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) throw Error('Email tidak valid.');
    // Never send password/hash or change activation through Quick Edit.
    return { id: record.id, ...values, active: record.active !== false };
  }
  // Preserve version for optimistic locking and all non-edited fields.
  return { ...record, ...values, type };
}
