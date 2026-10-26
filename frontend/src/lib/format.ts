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
