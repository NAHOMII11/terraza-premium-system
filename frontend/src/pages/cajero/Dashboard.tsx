import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

interface Order {
  id: number;
  mesaId: number;
  estado: string;
  total: number;
}

type Tab = 'orders' | 'reports';

interface InventoryRow {
  id: number;
  productoNombre?: string;
  nombreProducto?: string;
  cantidad?: number;
  stock?: number;
}

export default function Dashboard() {
  useInactivityLogout();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [askLogout, setAskLogout] = useState(false);

  const [payModal, setPayModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [amount, setAmount] = useState('');
  const [change, setChange] = useState('');

  const sedeId = localStorage.getItem('sedeId') || '1';
  const cashierId = localStorage.getItem('usuarioId') || '3';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/orders?sedeId=${sedeId}`).catch(() => ({ data: [] })),
      api.get(`/api/inventory?sedeId=${sedeId}`).catch(() => ({ data: [] })),
    ])
      .then(([rO, rI]) => {
        setOrders(Array.isArray(rO.data) ? rO.data : []);
        setInventory(Array.isArray(rI.data) ? rI.data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [sedeId]);

  const logout = async () => {
    setAskLogout(false);
    try {
      await api.post('/api/auth/logout');
    } catch {}
    localStorage.clear();
    navigate('/login');
  };

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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'var(--bar-dark)', borderColor: 'rgba(212,162,76,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="var(--bar-gold)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
            </svg>
            <div>
              <p className="font-display text-white text-lg leading-none">Terraza Premium</p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5"
                 style={{ letterSpacing: '0.25em', color: 'var(--bar-gold)' }}>
                Cashier
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-white/70 text-xs">{localStorage.getItem('email')}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--bar-gold)' }}>
                Cashier
              </p>
            </div>
            {localStorage.getItem('rol') === 'ADMIN' && (
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-white/60 hover:text-white text-sm transition-colors border rounded-md px-3 py-1.5"
                style={{ borderColor: 'rgba(212,162,76,0.3)' }}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => navigate('/mesera/inventario')}
              className="text-white/60 hover:text-white text-sm transition-colors border rounded-md px-3 py-1.5"
              style={{ borderColor: 'rgba(212,162,76,0.3)' }}
            >
              Inventory
            </button>
            <button
              onClick={() => setAskLogout(true)}
              className="text-white/60 hover:text-white text-sm transition-colors border rounded-md px-3 py-1.5"
              style={{ borderColor: 'rgba(212,162,76,0.3)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2"
             style={{ letterSpacing: '0.15em' }}>
            Cashier panel
          </p>
          <h1 className="font-display text-4xl" style={{ color: 'var(--bar-dark)' }}>
            Welcome, Cashier
          </h1>
        </header>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
               style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534' }}>
            {message}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {([
            { key: 'orders', label: `Orders (${orders.length})` },
            { key: 'reports', label: 'Reports' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-lg border text-sm transition-all"
              style={{
                background: tab === t.key ? 'var(--bar-dark)' : 'white',
                color: tab === t.key ? 'var(--bar-gold)' : '#555',
                borderColor: tab === t.key ? 'var(--bar-dark)' : 'rgba(0,0,0,0.1)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading data...</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden"
               style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
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
                            ${o.total?.toLocaleString()}
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

            {tab === 'reports' && (
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="font-display text-xl mb-1" style={{ color: 'var(--bar-dark)' }}>
                    Sales pending collection
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Open orders at this branch.</p>
                  <p className="font-display text-3xl" style={{ color: 'var(--bar-amber)' }}>
                    ${orders.reduce((s, o) => s + (Number(o.total) || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{orders.length} open order(s)</p>
                </div>
                <div>
                  <h3 className="font-display text-xl mb-3" style={{ color: 'var(--bar-dark)' }}>
                    Inventory · this branch
                  </h3>
                  {inventory.length === 0 ? (
                    <p className="text-gray-400 text-sm">No inventory rows.</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Product</th>
                          <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((row) => (
                          <tr key={row.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            <td className="px-4 py-2">{row.productoNombre || row.nombreProducto}</td>
                            <td className="px-4 py-2 text-right">{row.cantidad ?? row.stock ?? 0}</td>
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
      </main>

      {payModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
              Register payment
            </h3>

            <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--bar-cream)' }}>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Order</p>
              <p className="font-medium">#{selectedOrder.id} · Table {selectedOrder.mesaId}</p>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-3 mb-1">Total</p>
              <p className="font-display text-3xl" style={{ color: 'var(--bar-amber)' }}>
                ${selectedOrder.total?.toLocaleString()}
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
                <option value="TARJETA_CREDITO">Credit card (single payment)</option>
                <option value="TARJETA_DEBITO">Debit card</option>
              </select>
            </label>
            {isCard && (
              <p className="text-xs text-gray-500 mb-3">
                Card charges the order total in one payment. Installments are not used.
              </p>
            )}

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
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                style={{
                  borderColor: 'rgba(0,0,0,0.15)',
                  background: isCard ? '#f9f9f9' : 'white',
                }}
              />
            </label>

            {paymentMethod === 'EFECTIVO' && (
              <label className="block mb-4">
                <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                  Change
                </span>
                <input
                  type="number"
                  value={change}
                  readOnly
                  className="mt-1 w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'rgba(0,0,0,0.15)', background: '#f9f9f9' }}
                />
              </label>
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
      <ConfirmDialog
        open={askLogout}
        title="Sign out"
        message="Close this session?"
        confirmLabel="Sign out"
        onConfirm={logout}
        onCancel={() => setAskLogout(false)}
      />
    </div>
  );
}