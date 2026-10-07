import { useEffect, useState } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { InventarioItem, Producto } from '../types';

function apiMessage(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { message?: string; error?: string } } };
  return e.response?.data?.message || e.response?.data?.error || fallback;
}

export default function Inventario() {
  useInactivityLogout();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [draftStock, setDraftStock] = useState<Record<number, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [addProductoId, setAddProductoId] = useState('');
  const [addStock, setAddStock] = useState('50');
  const [adding, setAdding] = useState(false);
  const sedeId = localStorage.getItem('sedeId') || '1';

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/inventory?sedeId=${sedeId}`),
      api.get('/api/products').catch(() => ({ data: [] })),
    ])
      .then(([rInv, rProd]) => {
        setItems(Array.isArray(rInv.data) ? rInv.data : []);
        setProductos(Array.isArray(rProd.data) ? rProd.data : []);
        setError('');
      })
      .catch((err) => {
        setError(apiMessage(err, 'Error loading inventory'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [sedeId]);

  const filtered = items.filter((i) =>
    (i.productoNombre || '').toLowerCase().includes(search.toLowerCase())
  );

  const enInventario = new Set(items.map((i) => i.productoId));
  const disponibles = productos.filter((p) => !enInventario.has(p.id));

  const stockLevel = (qty: number) => {
    if (qty <= 0) return { label: 'Out of stock', color: '#b71c1c', bg: '#ffebee' };
    if (qty > 20) return { label: 'Optimal', color: '#1b5e20', bg: '#e8f5e9' };
    if (qty > 5) return { label: 'Moderate', color: '#e65100', bg: '#fff8e1' };
    return { label: 'Low', color: '#b71c1c', bg: '#ffebee' };
  };

  const saveStock = async (item: InventarioItem) => {
    const raw = draftStock[item.id] ?? String(item.cantidad);
    const stock = Number(raw);
    if (!Number.isInteger(stock) || stock < 0) {
      setError('Stock must be a whole number of 0 or more');
      return;
    }
    setSavingId(item.id);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/api/inventory/${item.id}`, { stock });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, ...data, cantidad: data.cantidad ?? data.stock ?? stock }
            : i
        )
      );
      setDraftStock((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setMessage(`Stock updated: ${item.productoNombre}`);
    } catch (err) {
      setError(apiMessage(err, 'Could not update stock'));
    } finally {
      setSavingId(null);
    }
  };

  const addToInventory = async () => {
    if (!addProductoId) {
      setError('Select a product');
      return;
    }
    const stock = Number(addStock);
    if (!Number.isInteger(stock) || stock < 0) {
      setError('Stock must be a whole number of 0 or more');
      return;
    }
    setAdding(true);
    setError('');
    setMessage('');
    try {
      await api.post('/api/inventory', {
        sedeId: Number(sedeId),
        productoId: Number(addProductoId),
        stock,
      });
      setAddOpen(false);
      setAddProductoId('');
      setAddStock('50');
      setMessage('Product added to this branch inventory');
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not add product to inventory'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8 flex flex-wrap justify-between items-end gap-4">
          <div>
            <p
              className="text-xs uppercase tracking-widest text-gray-500 mb-2"
              style={{ letterSpacing: '0.15em' }}
            >
              Branch {sedeId}
            </p>
            <h1
              className="font-display text-4xl"
              style={{ color: 'var(--bar-dark)' }}
            >
              Inventory
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </p>
            {disponibles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAddOpen(true);
                  setError('');
                }}
                className="px-4 py-2 rounded-lg text-white text-sm"
                style={{ background: 'var(--bar-dark)' }}
              >
                Add to inventory
              </button>
            )}
          </div>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          />
        </div>

        {message && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
            style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534' }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-sm"
            style={{ background: '#fef2f2', color: '#991b1b' }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading inventory...</p>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-20 border-2 border-dashed rounded-xl"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <p className="text-gray-400">No products in inventory.</p>
          </div>
        ) : (
          <div
            className="bg-white rounded-xl border overflow-hidden"
            style={{ borderColor: 'rgba(0,0,0,0.08)' }}
          >
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                >
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-gray-500 font-medium">
                    Product
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-widest text-gray-500 font-medium">
                    Stock
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-widest text-gray-500 font-medium hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-widest text-gray-500 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const level = stockLevel(it.cantidad);
                  const value = draftStock[it.id] ?? String(it.cantidad);
                  const dirty = Number(value) !== Number(it.cantidad);
                  return (
                    <tr
                      key={it.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: 'rgba(0,0,0,0.05)' }}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">
                          {it.productoNombre}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={value}
                          onChange={(e) =>
                            setDraftStock((prev) => ({
                              ...prev,
                              [it.id]: e.target.value,
                            }))
                          }
                          className="w-24 text-right px-2 py-1.5 rounded-lg border bg-white font-display text-lg"
                          style={{ color: 'var(--bar-dark)', borderColor: 'rgba(0,0,0,0.12)' }}
                        />
                        <span className="text-gray-400 text-xs ml-1">u.</span>
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: level.bg, color: level.color }}
                        >
                          {level.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          disabled={!dirty || savingId === it.id}
                          onClick={() => saveStock(it)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                          style={{
                            background: dirty ? 'var(--bar-dark)' : '#e5e7eb',
                            color: dirty ? 'white' : '#6b7280',
                          }}
                        >
                          {savingId === it.id ? 'Saving...' : 'Save stock'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {addOpen && disponibles.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-2" style={{ color: 'var(--bar-dark)' }}>
              Add to inventory
            </h3>
            <label className="block mb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                Product
              </span>
              <select
                value={addProductoId}
                onChange={(e) => setAddProductoId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
              >
                <option value="">Select...</option>
                {disponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block mb-4">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                Initial stock
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={addStock}
                onChange={(e) => setAddStock(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adding}
                onClick={addToInventory}
                className="px-4 py-2 rounded-lg text-white text-sm"
                style={{ background: 'var(--bar-dark)' }}
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
