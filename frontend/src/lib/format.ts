export function formatDateTime(value?: string | null) {
  if (!value) return '';
  return String(value).replace('T', ' ').replace(/\.\d+/, '').slice(0, 16);
}

export function paymentMethodLabel(method?: string | null) {
  if (method === 'EFECTIVO') return 'Cash';
  if (method === 'TARJETA_CREDITO') return 'Credit card';
  if (method === 'TARJETA_DEBITO') return 'Debit card';
  return method || '';
}

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 'COP 0';
  return `COP ${Math.round(n).toLocaleString('en-US')}`;
}

export function branchLabel(name?: string | null) {
  return (name || '').replace(/^Sede\s+/i, '').trim();
}

export function currentBranch() {
  return branchLabel(localStorage.getItem('sedeNombre')) || `Branch ${localStorage.getItem('sedeId') || '1'}`;
}
