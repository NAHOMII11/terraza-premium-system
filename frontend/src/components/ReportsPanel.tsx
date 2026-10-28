import { useState } from 'react';
import api from '../api/api';
import { downloadCsv, downloadExcel } from '../lib/export';

interface SaleRow {
  pedidoId: number;
  fecha?: string;
  sede?: string;
  mesa?: number;
  total: number;
  metodoPago?: string;
  cajero?: string;
}

interface SoldRow {
  fecha?: string;
  codigo?: string;
  nombre?: string;
  cantidadVendida?: number;
  valorCompra?: number;
  valorVenta?: number;
  ganancia?: number;
  sede?: string;
}

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) u.set(k, v);
  });
  const s = u.toString();
  return s ? `?${s}` : '';
}

function fmtDate(value?: string) {
  if (!value) return '';
  return String(value).replace('T', ' ').slice(0, 16);
}

function money(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function payLabel(method?: string) {
  if (method === 'EFECTIVO') return 'Cash';
  if (method === 'TARJETA_CREDITO') return 'Credit card';
  if (method === 'TARJETA_DEBITO') return 'Debit card';
  return method || '';
}

export default function ReportsPanel({
  sedeId,
  allowAllBranches,
}: {
  sedeId: string;
  allowAllBranches: boolean;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [scope, setScope] = useState<'branch' | 'all'>(allowAllBranches ? 'all' : 'branch');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const query = () => {
    const sede = allowAllBranches && scope === 'all' ? undefined : sedeId;
    return qs({ sedeId: sede, from, to });
  };

  const exportSales = async (kind: 'csv' | 'excel') => {
    setBusy(true);
    setNote('');
    try {
      const { data } = await api.get(`/api/reports/sales${query()}`);
      const sales: SaleRow[] = Array.isArray(data) ? data : [];
      if (sales.length === 0) {
        setNote('No sales in this range.');
        return;
      }
      const headers = ['Order', 'Date', 'Branch', 'Table', 'Total (COP)', 'Payment method', 'Cashier'];
      const rows = sales.map((r) => [
        r.pedidoId,
        fmtDate(r.fecha),
        r.sede || '',
        r.mesa ?? '',
        money(r.total),
        payLabel(r.metodoPago),
        r.cajero || '',
      ]);
      if (kind === 'csv') downloadCsv('sales-report', headers, rows);
      else downloadExcel('sales-report', headers, rows, 'Sales');
    } catch {
      setNote('Could not download sales report.');
    } finally {
      setBusy(false);
    }
  };

  const exportSold = async (kind: 'csv' | 'excel') => {
    setBusy(true);
    setNote('');
    try {
      const { data } = await api.get(`/api/reports/inventory-sold${query()}`);
      const sold: SoldRow[] = Array.isArray(data) ? data : [];
      if (sold.length === 0) {
        setNote('No inventory rows in this range.');
        return;
      }
      const headers = ['Date', 'Code', 'Name', 'Quantity sold', 'Purchase (COP)', 'Sale (COP)', 'Profit (COP)', 'Branch'];
      const rows = sold.map((r) => [
        fmtDate(String(r.fecha || '')),
        r.codigo || '',
        r.nombre || '',
        r.cantidadVendida ?? 0,
        money(r.valorCompra),
        money(r.valorVenta),
        money(r.ganancia),
        r.sede || '',
      ]);
      if (kind === 'csv') downloadCsv('inventory-report', headers, rows);
      else downloadExcel('inventory-report', headers, rows, 'Inventory');
    } catch {
      setNote('Could not download inventory report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#c9a227' }}>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-transparent text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#c9a227' }}>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-transparent text-sm" />
        </label>
        {allowAllBranches && (
          <label className="text-sm">
            <span className="block text-xs uppercase tracking-widest mb-1" style={{ color: '#c9a227' }}>Scope</span>
            <select value={scope} onChange={(e) => setScope(e.target.value as 'branch' | 'all')}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm">
              <option value="branch">Current branch</option>
              <option value="all">All branches</option>
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSales('csv')}>Sales report CSV</button>
        <button type="button" disabled={busy} className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSales('excel')}>Sales report Excel</button>
        <button type="button" disabled={busy} className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSold('csv')}>Inventory report CSV</button>
        <button type="button" disabled={busy} className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSold('excel')}>Inventory report Excel</button>
      </div>
      {note && <p className="text-sm text-gray-400">{note}</p>}
    </div>
  );
}
