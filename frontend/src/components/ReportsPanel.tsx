import { useEffect, useState } from 'react';
import api from '../api/api';
import { downloadCsv, downloadExcel } from '../lib/export';
import { formatMoney } from '../lib/format';

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
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [sold, setSold] = useState<SoldRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const sede = allowAllBranches && scope === 'all' ? undefined : sedeId;
    const q = qs({ sedeId: sede, from, to });
    Promise.all([
      api.get(`/api/reports/sales${q}`).catch(() => ({ data: [] })),
      api.get(`/api/reports/inventory-sold${q}`).catch(() => ({ data: [] })),
    ])
      .then(([rS, rI]) => {
        setSales(Array.isArray(rS.data) ? rS.data : []);
        setSold(Array.isArray(rI.data) ? rI.data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [sedeId, scope]);

  const exportSales = (kind: 'csv' | 'excel') => {
    const headers = ['Order', 'Date', 'Branch', 'Table', 'Total', 'Method', 'Cashier'];
    const rows = sales.map((r) => [r.pedidoId, r.fecha || '', r.sede || '', r.mesa ?? '', Number(r.total) || 0, r.metodoPago || '', r.cajero || '']);
    if (kind === 'csv') downloadCsv('sales-report', headers, rows);
    else downloadExcel('sales-report', headers, rows);
  };

  const exportSold = (kind: 'csv' | 'excel') => {
    const headers = ['Date', 'Code', 'Name', 'Qty sold', 'Purchase', 'Sale', 'Profit', 'Branch'];
    const rows = sold.map((r) => [
      r.fecha || '',
      r.codigo || '',
      r.nombre || '',
      r.cantidadVendida ?? 0,
      Number(r.valorCompra) || 0,
      Number(r.valorVenta) || 0,
      Number(r.ganancia) || 0,
      r.sede || '',
    ]);
    if (kind === 'csv') downloadCsv('inventory-report', headers, rows);
    else downloadExcel('inventory-report', headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: '#926208' }}>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-transparent text-sm" />
        </label>
        <label className="text-sm">
          <span className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: '#926208' }}>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-transparent text-sm" />
        </label>
        {allowAllBranches && (
          <label className="text-sm">
            <span className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: '#926208' }}>Scope</span>
            <select value={scope} onChange={(e) => setScope(e.target.value as 'branch' | 'all')}
              className="px-3 py-2 rounded-lg border bg-transparent text-sm">
              <option value="branch">Current branch</option>
              <option value="all">All branches</option>
            </select>
          </label>
        )}
        <button type="button" onClick={load} className="px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#926208', color: '#071525' }}>
          Apply
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSales('csv')}>Sales report CSV</button>
        <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSales('excel')}>Sales report Excel</button>
        <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSold('csv')}>Inventory report CSV</button>
        <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportSold('excel')}>Inventory report Excel</button>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading reports...</p> : (
        <>
          <div>
            <h3 className="font-display text-xl mb-3">Sales report</h3>
            {sales.length === 0 ? <p className="text-gray-400 text-sm">No sales in this range.</p> : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest" style={{ color: '#926208' }}>Order</th>
                    <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest" style={{ color: '#926208' }}>Date</th>
                    <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest" style={{ color: '#926208' }}>Branch</th>
                    <th className="text-right px-3 py-2 text-[10px] uppercase tracking-widest" style={{ color: '#926208' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((r) => (
                    <tr key={r.pedidoId} className="border-t" style={{ borderColor: 'rgba(247,242,233,0.08)' }}>
                      <td className="px-3 py-2">#{r.pedidoId}</td>
                      <td className="px-3 py-2 text-sm">{r.fecha ? String(r.fecha).replace('T', ' ').slice(0, 16) : '—'}</td>
                      <td className="px-3 py-2">{r.sede}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div>
            <h3 className="font-display text-xl mb-3">Inventory report</h3>
            {sold.length === 0 ? <p className="text-gray-400 text-sm">No inventory rows in this range.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr>
                      {['Date', 'Code', 'Name', 'Qty', 'Purchase', 'Sale', 'Profit', 'Branch'].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-[10px] uppercase tracking-widest" style={{ color: '#926208' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sold.map((r, i) => (
                      <tr key={`${r.codigo}-${r.fecha}-${r.sede}-${i}`} className="border-t" style={{ borderColor: 'rgba(247,242,233,0.08)' }}>
                        <td className="px-3 py-2 text-sm">{r.fecha || '—'}</td>
                        <td className="px-3 py-2">{r.codigo}</td>
                        <td className="px-3 py-2">{r.nombre}</td>
                        <td className="px-3 py-2">{r.cantidadVendida}</td>
                        <td className="px-3 py-2">{formatMoney(r.valorCompra)}</td>
                        <td className="px-3 py-2">{formatMoney(r.valorVenta)}</td>
                        <td className="px-3 py-2">{formatMoney(r.ganancia)}</td>
                        <td className="px-3 py-2">{r.sede}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
