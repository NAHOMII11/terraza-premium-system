import { useEffect, useState } from 'react';
import api from '../../api/api';
import PageShell from '../../components/PageShell';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { formatMoney } from '../../lib/format';
import { downloadCsv, downloadExcel } from '../../lib/export';
import AppLayout from '../../components/AppLayout';
import InvoiceView, { type Invoice } from '../../components/InvoiceView';
import ReportsPanel from '../../components/ReportsPanel';

interface Order {
  id: number;
  mesaId: number;
  estado: string;
  total: number;
}

type Tab = 'orders' | 'reports' | 'types';

interface ProductType {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface InventoryRow {
  id: number;
  productoNombre?: string;
  nombreProducto?: string;
  cantidad?: number;
  stock?: number;
}

export default function Dashboard() {
  useInactivityLogout();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [typeModal, setTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [typeForm, setTypeForm] = useState({ nombre: '', descripcion: '' });
  const [savingType, setSavingType] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [payModal, setPayModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [amount, setAmount] = useState('');
  const [change, setChange] = useState('');
  const [payLeft, setPayLeft] = useState(90);

  const sedeId = localStorage.getItem('sedeId') || '1';
  const cashierId = localStorage.getItem('usuarioId') || '3';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/orders?sedeId=${sedeId}`).catch(() => ({ data: [] })),
      api.get(`/api/inventory?sedeId=${sedeId}`).catch(() => ({ data: [] })),
      api.get(`/api/invoices?sedeId=${sedeId}`).catch(() => ({ data: [] })),
      api.get('/api/product-types').catch(() => ({ data: [] })),
    ])
      .then(([rO, rI, rInv, rT]) => {
        setOrders(Array.isArray(rO.data) ? rO.data : []);
        setInventory(Array.isArray(rI.data) ? rI.data : []);
        setInvoices(Array.isArray(rInv.data) ? rInv.data : []);
        setTypes(Array.isArray(rT.data) ? rT.data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [sedeId]);

  useEffect(() => {
    if (!payModal) return;
    const started = Date.now();
    setPayLeft(90);
    const tick = setInterval(() => {
      const left = 90 - Math.floor((Date.now() - started) / 1000);
      if (left <= 0) {
        clearInterval(tick);
        setPayModal(false);
        setSelectedOrder(null);
        setMessage('Payment timed out. The order remains open.');
      } else {
        setPayLeft(left);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [payModal]);

  const openPayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentMethod('EFECTIVO');
    setAmount(String(order.total));
    setChange('0');
    setPayModal(true);
    setError('');
    setMessage('');
  };

  const isCard = paymentMethod === 'TARJETA_CREDITO' || paymentMethod === 'TARJETA_DEBITO';

  const openEditType = (t: ProductType) => {
    setEditingType(t);
    setTypeForm({ nombre: t.nombre, descripcion: t.descripcion || '' });
    setTypeModal(true);
    setError('');
  };

  const saveType = async () => {
    if (!editingType) return;
    setSavingType(true);
    setError('');
    try {
      await api.put(`/api/product-types/${editingType.id}`, typeForm);
      setMessage('Product type updated');
      setTypeModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save product type');
    } finally {
      setSavingType(false);
    }
  };

  const registerPayment = async () => {
    if (!selectedOrder) return;
    const charged = isCard ? selectedOrder.total : Number(amount);
    if (!charged || charged < selectedOrder.total) {
      setError('Amount must be greater than or equal to the order total');
      return;
    }

    try {
      const body = {
        pedidoId: selectedOrder.id,
        cajeroId: Number(cashierId),
        metodoPago: paymentMethod,
        monto: charged,
        cambio: isCard ? 0 : Number(change) || 0,
      };

      await api.post('/api/pagos', body);
      setMessage(`Payment registered. Order #${selectedOrder.id} closed. Table is now available.`);
      setPayModal(false);
      try {
        const { data } = await api.get(`/api/invoices/${selectedOrder.id}`);
        setInvoice(data);
      } catch {}
      loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Error registering payment'
      );
    }
  };

  const statusConfig = (estado: string) => {
    const e = estado?.toUpperCase();
    if (e === 'ABIERTO' || e === 'PENDIENTE')
      return { bg: '#fff8e1', color: '#e65100', label: 'Open' };
    if (e === 'CERRADO') return { bg: '#e8f5e9', color: '#1b5e20', label: 'Closed' };
    if (e === 'CANCELADO')
      return { bg: '#ffebee', color: '#b71c1c', label: 'Cancelled' };
    return { bg: '#f5f5f5', color: '#616161', label: estado };
  };

  const exportInvoices = (kind: 'csv' | 'excel') => {
    const headers = ['Invoice', 'Table', 'Waiter', 'Total', 'Closed'];
    const rows = invoices.map((row) => [
      row.pedidoId,
      row.mesaNumero ?? '',
      row.meseroNombre || '',
      Number(row.total) || 0,
      row.fechaCierre || '',
    ]);
    const name = `invoices-branch-${sedeId}`;
    if (kind === 'csv') downloadCsv(name, headers, rows);
    else downloadExcel(name, headers, rows);
  };

  const openInvoice = async (id: number) => {
    try {
      const { data } = await api.get(`/api/invoices/${id}`);
      setInvoice(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load invoice');
    }
  };

  return (
    <PageShell>
    <AppLayout
      eyebrow="Welcome to Terraza Premium"
      title="Cashier"
    >

        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
               style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534' }}>
            {message}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {([
            { key: 'orders', label: `Orders (${orders.length})` },
            { key: 'types', label: `Types (${types.length})` },
            { key: 'reports', label: 'Reports' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-lg border text-sm transition-all"
              style={{
                  background: tab === t.key ? 'var(--bar-gold)' : 'transparent',
                  color: tab === t.key ? '#07121c' : '#f7f2e9',
                  borderColor: 'rgba(146, 98, 8,0.35)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading data...</p>
        ) : (
          <div className="panel-card rounded-xl overflow-hidden">
            {tab === 'orders' && (
              orders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400">No orders registered</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Order</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Table</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Status</th>
                      <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Total</th>
                      <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const cfg = statusConfig(o.estado);
                      return (
                        <tr key={o.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                          <td className="px-6 py-4 font-medium">#{o.id}</td>
                          <td className="px-6 py-4 text-sm">Table {o.mesaId}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                                  style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-display"
                              style={{ color: 'var(--bar-amber)' }}>
                            {formatMoney(o.total)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {o.estado === 'ABIERTO' && (
                              <button
                                onClick={() => openPayment(o)}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:translate-y-[-1px]"
                                style={{ background: 'var(--bar-dark)' }}
                              >
                                Charge
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}

            {tab === 'types' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Description</th>
                    <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{t.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.descripcion || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => openEditType(t)}
                          className="text-sm px-3 py-1.5 rounded-lg border">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'reports' && (
              <div className="p-6 space-y-8">
                <ReportsPanel sedeId={sedeId} allowAllBranches={false} />
                <div>
                  <h3 className="font-display text-xl mb-1" style={{ color: 'var(--bar-dark)' }}>
                    Sales pending collection
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Open orders.</p>
                  <p className="font-display text-3xl" style={{ color: 'var(--bar-amber)' }}>
                    {formatMoney(orders.reduce((s, o) => s + (Number(o.total) || 0), 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{orders.length} open order(s)</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportInvoices('csv')}>Invoices CSV</button>
                  <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => exportInvoices('excel')}>Invoices Excel</button>
                </div>
                <div>
                  <h3 className="font-display text-xl mb-3" style={{ color: 'var(--bar-dark)' }}>
                    Closed invoices
                  </h3>
                  {invoices.length === 0 ? (
                    <p className="text-gray-400 text-sm">No invoices yet.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Invoice</th>
                          <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Table</th>
                          <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Total</th>
                          <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((row) => (
                          <tr key={row.pedidoId} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            <td className="px-4 py-2">#{row.pedidoId}</td>
                            <td className="px-4 py-2">Table {row.mesaNumero ?? '—'}</td>
                            <td className="px-4 py-2 text-right">{formatMoney(row.total)}</td>
                            <td className="px-4 py-2 text-right">
                              <button type="button" className="text-sm px-3 py-1.5 rounded-lg border" onClick={() => openInvoice(row.pedidoId)}>View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      {payModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="font-display text-2xl" style={{ color: 'var(--bar-dark)' }}>
                Register payment
              </h3>
              <p className="text-sm font-medium" style={{ color: payLeft <= 15 ? '#b42318' : '#926208' }}>
                {payLeft}s
              </p>
            </div>

            <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--bar-cream)' }}>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Order</p>
              <p className="font-medium">#{selectedOrder.id} · Table {selectedOrder.mesaId}</p>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-3 mb-1">Total</p>
              <p className="font-display text-3xl" style={{ color: 'var(--bar-amber)' }}>
                {formatMoney(selectedOrder.total)}
              </p>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm"
                   style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}

            <label className="block mb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                Payment method
              </span>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const method = e.target.value;
                  setPaymentMethod(method);
                  if (method !== 'EFECTIVO') {
                    setAmount(String(selectedOrder.total));
                    setChange('0');
                  }
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              >
                <option value="EFECTIVO">Cash</option>
                <option value="TARJETA_CREDITO">Credit card</option>
                <option value="TARJETA_DEBITO">Debit card</option>
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                {isCard ? 'Amount charged' : 'Amount received'}
              </span>
              <input
                type="number"
                value={isCard ? selectedOrder.total : amount}
                readOnly={isCard}
                onChange={(e) => {
                  setAmount(e.target.value);
                  const c = Number(e.target.value) - selectedOrder.total;
                  setChange(String(c > 0 ? c : 0));
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'rgba(146, 98, 8,0.35)',
                  background: '#071525',
                  color: '#f7f2e9',
                }}
              />
            </label>

            {paymentMethod === 'EFECTIVO' && (
              <div className="mb-4 p-4 rounded-lg" style={{ background: '#071525', border: '1px solid rgba(146, 98, 8,0.35)' }}>
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#a7afbc' }}>
                  Change
                </p>
                <p className="text-base mt-1" style={{ color: '#f7f2e9' }}>
                  {Math.round(Number(change) || 0).toLocaleString('en-US')}
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setPayModal(false)}
                className="flex-1 py-3 rounded-lg border font-medium text-sm text-gray-600 hover:bg-gray-50"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              >
                Cancel
              </button>
              <button
                onClick={registerPayment}
                className="flex-1 py-3 rounded-lg text-white font-medium text-sm transition-all hover:translate-y-[-1px]"
                style={{ background: 'var(--bar-dark)' }}
              >
                Charge and close
              </button>
            </div>
          </div>
        </div>
      )}
      {typeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
              Edit product type
            </h3>
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Name</span>
              <input className="mt-1 w-full px-3 py-2 rounded-lg border bg-white text-sm" value={typeForm.nombre}
                onChange={(e) => setTypeForm({ ...typeForm, nombre: e.target.value })} />
            </label>
            <label className="block mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-600">Description</span>
              <input className="mt-1 w-full px-3 py-2 rounded-lg border bg-white text-sm" value={typeForm.descripcion}
                onChange={(e) => setTypeForm({ ...typeForm, descripcion: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTypeModal(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button type="button" disabled={savingType} onClick={saveType}
                className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
                {savingType ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {invoice && <InvoiceView invoice={invoice} onClose={() => setInvoice(null)} />}
    </AppLayout>
    </PageShell>
  );
}