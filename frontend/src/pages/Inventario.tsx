import { useEffect, useState } from 'react';
import api from '../api/api';
import PageShell from '../components/PageShell';
import AppLayout from '../components/AppLayout';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { InventarioItem, Producto } from '../types';
import { currentBranch } from '../lib/format';

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
    if (qty <= 0) return { label: 'Out of stock', color: '#f3d0c8', bg: 'rgba(139,44,44,0.35)' };
    if (qty > 20) return { label: 'Optimal', color: '#b7e4c7', bg: 'rgba(34,120,70,0.28)' };
    if (qty > 5) return { label: 'Moderate', color: '#926208', bg: 'rgba(146, 98, 8,0.18)' };
    return { label: 'Low', color: '#f3d0c8', bg: 'rgba(139,44,44,0.28)' };
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
    <PageShell>
    <AppLayout
      eyebrow="Welcome to Terraza Premium"
      title="Inventory"
      subtitle={`Branch · ${currentBranch()}`}
    >
          <div className="mb-8 flex flex-wrap justify-end items-end gap-4">
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
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: '#926208', color: '#071525' }}
              >
                Add to inventory
              </button>
            )}
          </div>
          </div>

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
            className="rounded-xl border overflow-hidden"
            style={{ background: '#10243d', borderColor: 'rgba(146, 98, 8,0.2)' }}
          >
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="text-left">Product</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right hidden sm:table-cell">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const level = stockLevel(it.cantidad);
                  const value = draftStock[it.id] ?? String(it.cantidad);
                  const dirty = Number(value) !== Number(it.cantidad);
                  return (
                    <tr key={it.id}>
                      <td>
                        <p style={{ color: '#f7f2e9' }}>{it.productoNombre}</p>
                      </td>
                      <td className="text-right">
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
                          className="w-24 text-right px-2 py-1.5 rounded-lg border font-display text-lg"
                          style={{
                            background: '#071525',
                            color: '#f7f2e9',
                            borderColor: 'rgba(146, 98, 8,0.35)',
                          }}
                        />
                        <span className="text-xs ml-1" style={{ color: '#a7afbc' }}>u.</span>
                      </td>
                      <td className="text-right hidden sm:table-cell">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: level.bg, color: level.color }}
                        >
                          {level.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          disabled={!dirty || savingId === it.id}
                          onClick={() => saveStock(it)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                          style={{
                            background: dirty ? '#926208' : 'transparent',
                            color: dirty ? '#071525' : '#a7afbc',
                            border: '1px solid rgba(146, 98, 8,0.35)',
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

      {addOpen && disponibles.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-2" style={{ color: '#f7f2e9' }}>
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
    </AppLayout>
    </PageShell>
  );
}
