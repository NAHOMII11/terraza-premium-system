import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { downloadCsv, downloadExcel } from '../lib/export';
import { branchLabel, currentBranch, formatMoney } from '../lib/format';

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
  onApply,
}: {
  sedeId: string;
  allowAllBranches: boolean;
  onApply?: (range: { from: string; to: string; scope: 'branch' | 'all' }) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [scope, setScope] = useState<'branch' | 'all'>(allowAllBranches ? 'all' : 'branch');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [appliedScope, setAppliedScope] = useState<'branch' | 'all'>(allowAllBranches ? 'all' : 'branch');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [sold, setSold] = useState<SoldRow[]>([]);

  const queryFor = (start: string, end: string, nextScope: 'branch' | 'all') => {
    const sede = allowAllBranches && nextScope === 'all' ? undefined : sedeId;
    return qs({ sedeId: sede, from: start, to: end });
  };

  const query = () => queryFor(appliedFrom, appliedTo, appliedScope);
  const showAllSedes = allowAllBranches && appliedScope === 'all';

  const loadSummary = async (start: string, end: string, nextScope: 'branch' | 'all') => {
    const q = queryFor(start, end, nextScope);
    const [rSales, rSold] = await Promise.all([
      api.get(`/api/reports/sales${q}`).catch(() => ({ data: [] })),
      api.get(`/api/reports/inventory-sold${q}`).catch(() => ({ data: [] })),
    ]);
    setSales(Array.isArray(rSales.data) ? rSales.data : []);
    setSold(Array.isArray(rSold.data) ? rSold.data : []);
  };

  const applyRange = (nextFrom: string, nextTo: string, nextScope: 'branch' | 'all') => {
    let start = nextFrom;
    let end = nextTo;
    if (start && end && start > end) {
      const swap = start;
      start = end;
      end = swap;
      setFrom(start);
      setTo(end);
    }
    setAppliedFrom(start);
    setAppliedTo(end);
    setAppliedScope(nextScope);
    onApply?.({ from: start, to: end, scope: nextScope });
    const sedeLabel = allowAllBranches && nextScope === 'all' ? 'all branches' : 'current branch';
    const range = start || end ? `${start || '…'} → ${end || '…'}` : 'all dates';
    setNote(`Filter applied: ${range} · ${sedeLabel}`);
    setBusy(true);
    loadSummary(start, end, nextScope)
      .catch(() => setNote('Could not load report totals.'))
      .finally(() => setBusy(false));
  };

  const applyFilter = () => applyRange(from, to, scope);

  const showAll = () => {
    setFrom('');
    setTo('');
    applyRange('', '', scope);
  };

  useEffect(() => {
    loadSummary(appliedFrom, appliedTo, appliedScope).catch(() => {});
  }, []);

  const summary = useMemo(() => {
    const bySede = new Map<string, { sales: number; profit: number; orders: number }>();
    sales.forEach((row) => {
      const name = branchLabel(row.sede) || '—';
      const cur = bySede.get(name) || { sales: 0, profit: 0, orders: 0 };
      cur.sales += money(row.total);
      cur.orders += 1;
      bySede.set(name, cur);
    });
    sold.forEach((row) => {
      const name = branchLabel(row.sede) || '—';
      const cur = bySede.get(name) || { sales: 0, profit: 0, orders: 0 };
      cur.profit += money(row.ganancia);
      bySede.set(name, cur);
    });
    const branches = [...bySede.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.sales - a.sales);

    const byTable = new Map<string, { sales: number; mesa: number; sede: string }>();
    sales.forEach((row) => {
      const sede = branchLabel(row.sede) || '—';
      const mesa = Number(row.mesa) || 0;
      const key = `${sede}#${mesa}`;
      const cur = byTable.get(key) || { sales: 0, mesa, sede };
      cur.sales += money(row.total);
      byTable.set(key, cur);
    });
    const tables = [...byTable.values()].sort((a, b) => b.sales - a.sales);
    const totalSales = branches.reduce((s, b) => s + b.sales, 0);
    const totalProfit = branches.reduce((s, b) => s + b.profit, 0);
    return {
      branches,
      tables,
      totalSales,
      totalProfit,
      topBranch: branches[0] || null,
      topTable: tables[0] || null,
    };
  }, [sales, sold]);

  const totalsSheet = () => {
    const branchRows = summary.branches.map((b, i) => [
      i + 1,
      b.name,
      b.orders,
      b.sales,
      b.profit,
    ]);
    if (showAllSedes) {
      branchRows.push(['', 'All branches', summary.branches.reduce((s, b) => s + b.orders, 0), summary.totalSales, summary.totalProfit]);
    }
    const tableRows = summary.tables.map((t, i) => [i + 1, t.sede, t.mesa, t.sales]);
    return [
      {
        name: 'By branch',
        headers: ['Rank', 'Branch', 'Orders', 'Sales (COP)', 'Profit (COP)'],
        rows: branchRows,
      },
      {
        name: 'By table',
        headers: ['Rank', 'Branch', 'Table', 'Sales (COP)'],
        rows: tableRows,
      },
    ];
  };

  const exportSales = async (kind: 'csv' | 'excel') => {
    setBusy(true);
    setNote('');
    try {
      const { data } = await api.get(`/api/reports/sales${query()}`);
      const rowsData: SaleRow[] = Array.isArray(data) ? data : [];
      if (rowsData.length === 0) {
        setNote('No sales in this range.');
        return;
      }
      const headers = ['Order', 'Date', 'Branch', 'Table', 'Total (COP)', 'Payment method', 'Cashier'];
      const rows = rowsData.map((r) => [
        r.pedidoId,
        fmtDate(r.fecha),
        r.sede || '',
        r.mesa ?? '',
        money(r.total),
        payLabel(r.metodoPago),
        r.cajero || '',
      ]);
      if (kind === 'csv') downloadCsv('sales-report', headers, rows);
      else downloadExcel('sales-report', headers, rows, 'Sales', totalsSheet());
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
      const rowsData: SoldRow[] = Array.isArray(data) ? data : [];
      if (rowsData.length === 0) {
        setNote('No inventory rows in this range.');
        return;
      }
      const headers = ['Date', 'Code', 'Name', 'Quantity sold', 'Purchase (COP)', 'Sale (COP)', 'Profit (COP)', 'Branch'];
      const rows = rowsData.map((r) => [
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
      else downloadExcel('inventory-report', headers, rows, 'Inventory', totalsSheet());
    } catch {
      setNote('Could not download inventory report.');
    } finally {
      setBusy(false);
    }
  };

  const card = { background: '#10243d', border: '1px solid rgba(146, 98, 8, 0.22)', borderRadius: '1rem', padding: '1rem 1.1rem' };

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
        <button
          type="button"
          onClick={applyFilter}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#926208', color: '#071525' }}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={showAll}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          Show all
        </button>
      </div>

      <div className={`grid sm:grid-cols-2 ${showAllSedes ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
        <div style={card}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>
            {showAllSedes ? 'All branches' : currentBranch()}
          </p>
          <p className="font-display text-2xl mt-1" style={{ color: '#f7f2e9' }}>{formatMoney(summary.totalSales)}</p>
          <p className="text-xs mt-1" style={{ color: '#c5cbd4' }}>Profit {formatMoney(summary.totalProfit)}</p>
        </div>
        {showAllSedes && (
        <div style={card}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>Top branch</p>
          <p className="font-display text-2xl mt-1" style={{ color: '#f7f2e9' }}>{summary.topBranch?.name || '—'}</p>
          <p className="text-xs mt-1" style={{ color: '#c5cbd4' }}>{summary.topBranch ? formatMoney(summary.topBranch.sales) : 'No sales'}</p>
        </div>
        )}
        <div style={card}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>Top table</p>
          <p className="font-display text-2xl mt-1" style={{ color: '#f7f2e9' }}>
            {summary.topTable ? `${String(summary.topTable.mesa).padStart(2, '0')}` : '—'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#c5cbd4' }}>
            {summary.topTable
              ? `${showAllSedes ? `${summary.topTable.sede} · ` : ''}${formatMoney(summary.topTable.sales)}`
              : 'No sales'}
          </p>
        </div>
        <div style={card}>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#c9a227' }}>Closed orders</p>
          <p className="font-display text-2xl mt-1" style={{ color: '#f7f2e9' }}>{sales.length}</p>
        </div>
      </div>

      {showAllSedes && (
      <div>
        <h3 className="font-display text-xl mb-3" style={{ color: '#f7f2e9' }}>Sales by branch</h3>
        {summary.branches.length === 0 ? (
          <p className="text-sm text-gray-400">No sales in this range.</p>
        ) : (
          <table className="premium-table w-full">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Orders</th>
                <th>Sales</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {summary.branches.map((b) => (
                <tr key={b.name}>
                  <td>{b.name}{summary.topBranch?.name === b.name ? ' · highest sales' : ''}</td>
                  <td>{b.orders}</td>
                  <td>{formatMoney(b.sales)}</td>
                  <td>{formatMoney(b.profit)}</td>
                </tr>
              ))}
              <tr>
                <td>All branches</td>
                <td>{summary.branches.reduce((s, b) => s + b.orders, 0)}</td>
                <td>{formatMoney(summary.totalSales)}</td>
                <td>{formatMoney(summary.totalProfit)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      )}

      {summary.tables.length > 0 && (
        <div>
          <h3 className="font-display text-xl mb-3" style={{ color: '#f7f2e9' }}>Sales by table</h3>
          <table className="premium-table w-full">
            <thead>
              <tr>
                {showAllSedes && <th>Branch</th>}
                <th>Table</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {summary.tables.slice(0, 12).map((t) => (
                <tr key={`${t.sede}-${t.mesa}`}>
                  {showAllSedes && <td>{t.sede}</td>}
                  <td>{String(t.mesa).padStart(2, '0')}{summary.topTable && t.sede === summary.topTable.sede && t.mesa === summary.topTable.mesa ? ' · highest sales' : ''}</td>
                  <td>{formatMoney(t.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
