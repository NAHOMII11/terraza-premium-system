import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { categoriaProducto } from '../api/api';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { Producto } from '../types';

interface CartItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

function stockMessage(message?: string) {
  if (!message) return 'Could not save the order.';
  const named = message.match(/producto\s+(.+)$/i);
  if (named) return `Out of stock: ${named[1]}`;
  const lower = message.toLowerCase();
  if (lower.includes('stock') || lower.includes('inventario')) return message;
  return message;
}

export default function TomarPedido() {
  useInactivityLogout();
  const { mesaId } = useParams();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('numero') || mesaId;
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tableOccupied, setTableOccupied] = useState(false);
  const [error, setError] = useState('');
  const [askRelease, setAskRelease] = useState(false);
  const sedeId = Number(localStorage.getItem('sedeId') || 1);

  useEffect(() => {
    api
      .get('/api/products')
      .then((r) => setProductos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api
      .get(`/api/tables?sedeId=${sedeId}`)
      .then((r) => {
        const mesa = r.data.find((m: any) => m.id === Number(mesaId));
        if (mesa && mesa.estado === 'OCUPADA') setTableOccupied(true);
      })
      .catch(() => {});
  }, [mesaId, sedeId]);

  const add = (p: Producto) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.productoId === p.id);
      if (exists) {
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 },
      ];
    });
  };

  const remove = (id: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productoId === id ? { ...i, cantidad: i.cantidad - 1 } : i
        )
        .filter((i) => i.cantidad > 0)
    );
  };

  const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const filtered = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (cart.length === 0) {
      setError('Add at least one bottle');
      return;
    }
    if (saving) return;

    setSaving(true);
    setError('');
    try {
      const body = {
        mesaId: Number(mesaId),
        sedeId,
        detalles: cart.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
        })),
      };

      await api.post('/api/orders', body);

      try {
        await api.put(`/api/tables/${mesaId}`, { estado: 'OCUPADA' });
      } catch (err) {
        console.warn('Could not update table:', err);
      }

      navigate('/mesera/mesas', { state: { message: 'Order saved. Table is now occupied.' } });
    } catch (err: any) {
      setError(
        stockMessage(
          err.response?.data?.message || err.response?.data?.error
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const releaseTable = async () => {
    setAskRelease(false);
    try {
      await api.put(`/api/tables/${mesaId}`, { estado: 'DISPONIBLE' });
      navigate('/mesera/mesas', { state: { message: 'Table released.' } });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Error releasing table'
      );
    }
  };

  // ==================== TABLE OCCUPIED ====================
  if (tableOccupied) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
        <Navbar />

        <main className="max-w-2xl mx-auto px-6 py-16">
          <button
            onClick={() => navigate('/mesera/mesas')}
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 mb-8 flex items-center gap-1"
            style={{ letterSpacing: '0.15em' }}
          >
            ← Back to tables
          </button>
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <div
            className="bg-white rounded-2xl border p-8 text-center"
            style={{ borderColor: 'rgba(212,162,76,0.35)' }}
          >
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
              style={{ background: '#ffebee' }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: '#ef5350' }}
              />
            </div>

            <p
              className="text-xs uppercase tracking-widest text-gray-500 mb-2"
              style={{ letterSpacing: '0.15em' }}
            >
              Table {tableNumber}
            </p>
            <h1
              className="font-display text-4xl mb-3"
              style={{ color: 'var(--bar-dark)' }}
            >
              This table is occupied
            </h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              It already has an active order. If the customer has finished and
              left, you can release the table for new customers.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/mesera/mesas')}
                className="px-6 py-3 rounded-lg border font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              >
                Back
              </button>
              <button
                onClick={() => setAskRelease(true)}
                className="px-6 py-3 rounded-lg text-white font-medium text-sm transition-all hover:translate-y-[-1px]"
                style={{ background: '#b71c1c' }}
              >
                Release table
              </button>
            </div>
          </div>
        </main>
        <ConfirmDialog
          open={askRelease}
          title="Release table"
          message="Release this table? It will become available for new customers."
          confirmLabel="Release"
          onConfirm={releaseTable}
          onCancel={() => setAskRelease(false)}
        />
      </div>
    );
  }

  // ==================== TABLE AVAILABLE → TAKE ORDER ====================
  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <button
            onClick={() => navigate('/mesera/mesas')}
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 mb-2 flex items-center gap-1"
            style={{ letterSpacing: '0.15em' }}
          >
            ← Back to tables
          </button>
          <h1
            className="font-display text-4xl"
            style={{ color: 'var(--bar-dark)' }}
          >
            Table {tableNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            New order · available
          </p>
        </header>
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-3">
            <input
              type="text"
              placeholder="Search bottle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-4 px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2"
              style={{ borderColor: 'rgba(0,0,0,0.1)' }}
            />

            {loading ? (
              <p className="text-gray-400">Loading menu...</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map((p) => {
                  const categoria = p.categoria || categoriaProducto(p.nombre);
                  return (
                    <button
                      key={p.id}
                      onClick={() => add(p)}
                      className="bg-white border rounded-xl p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all relative"
                      style={{ borderColor: 'rgba(212,162,76,0.35)' }}
                    >
                      <div
                        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: 'rgba(139,44,44,0.08)',
                          color: 'var(--bar-red)',
                        }}
                      >
                        +18
                      </div>
                      <p className="font-medium text-gray-800 text-sm pr-8">
                        {p.nombre}
                      </p>
                      <p
                        className="font-display text-xl mt-1"
                        style={{ color: 'var(--bar-gold)' }}
                      >
                        ${p.precio?.toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="lg:col-span-2">
            <div
              className="bg-white rounded-xl border sticky top-24"
              style={{ borderColor: 'rgba(0,0,0,0.08)' }}
            >
              <div
                className="px-6 py-4 border-b"
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
              >
                <p
                  className="text-xs uppercase tracking-widest text-gray-500"
                  style={{ letterSpacing: '0.15em' }}
                >
                  New order
                </p>
              </div>

              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">
                    No bottles yet.
                    <br />
                    Tap one to add it.
                  </p>
                ) : (
                  cart.map((i) => (
                    <div
                      key={i.productoId}
                      className="flex justify-between items-center py-3 border-b last:border-0"
                      style={{ borderColor: 'rgba(0,0,0,0.05)' }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">
                          {i.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${i.precio?.toLocaleString()} × {i.cantidad}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => remove(i.productoId)}
                          className="w-7 h-7 rounded border flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-medium text-sm">
                          {i.cantidad}
                        </span>
                        <button
                          onClick={() =>
                            add({
                              id: i.productoId,
                              nombre: i.nombre,
                              precio: i.precio,
                              tipoProductoId: 0,
                            })
                          }
                          className="w-7 h-7 rounded border flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                className="px-6 py-4 border-t"
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
              >
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs uppercase tracking-widest text-gray-500">
                    Total
                  </span>
                  <span
                    className="font-display text-3xl"
                    style={{ color: 'var(--bar-dark)' }}
                  >
                    ${total.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/mesera/mesas')}
                    className="flex-1 py-3 rounded-lg border font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={cart.length === 0 || saving}
                    className="flex-1 py-3 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-40 hover:translate-y-[-1px]"
                    style={{ background: 'var(--bar-dark)' }}
                  >
                    {saving ? 'Saving...' : 'Send to table'}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <ConfirmDialog
        open={askRelease}
        title="Release table"
        message="Release this table? It will become available for new customers."
        confirmLabel="Release"
        onConfirm={releaseTable}
        onCancel={() => setAskRelease(false)}
      />
    </div>
  );
}