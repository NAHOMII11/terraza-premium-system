import { useEffect, useState } from 'react';
import api from '../api/api';
import PageShell from '../components/PageShell';
import AppLayout from '../components/AppLayout';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { InventarioItem, Producto } from '../types';
import { branchLabel, currentBranch, isAdminAllBranches } from '../lib/format';

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

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(''), 10000);
    return () => window.clearTimeout(t);
  }, [message]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [draftStock, setDraftStock] = useState<Record<number, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [addProductoId, setAddProductoId] = useState('');
  const [addStock, setAddStock] = useState('50');
  const [adding, setAdding] = useState(false);
  const [addSedeId, setAddSedeId] = useState(Number(localStorage.getItem('sedeId') || '1'));
  const [branchList, setBranchList] = useState<{ id: number; nombre: string }[]>([]);
  const sedeId = localStorage.getItem('sedeId') || '1';
  const allBranches = isAdminAllBranches();

  const load = () => {
    setLoading(true);
    api
      .get('/api/branches')
      .then((rB) => {
        const list = (Array.isArray(rB.data) ? rB.data : []).filter(
          (b: { id: number; nombre: string }) => !/cantina/i.test(b.nombre || '')
        ) as { id: number; nombre: string }[];
        setBranchList(list);
        const targets = allBranches && list.length > 0 ? list : [{ id: Number(sedeId), nombre: currentBranch() }];
        return Promise.all([
          Promise.all(
            targets.map((b) =>
              api.get(`/api/inventory?sedeId=${b.id}`).then((r) => {
                const rows = Array.isArray(r.data) ? r.data : [];
                return rows.map((row: InventarioItem & { nombreProducto?: string; stock?: number }) => ({
                  id: row.id,
                  productoId: row.productoId,
                  productoNombre: row.productoNombre || row.nombreProducto || '',
                  cantidad: row.cantidad ?? row.stock ?? 0,
                  sedeId: Number(row.sedeId || b.id),
                }));
              }).catch(() => [] as InventarioItem[])
            )
          ),
          api.get('/api/products').catch(() => ({ data: [] })),
        ]);
      })
      .then(([groups, rProd]) => {
        setItems(groups.flat());
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
  }, [sedeId, allBranches]);

  const filtered = items.filter((i) =>
    (i.productoNombre || '').toLowerCase().includes(search.toLowerCase())
  );

  const enInventario = new Set(
    items.filter((i) => Number(i.sedeId) === Number(addSedeId)).map((i) => i.productoId)
  );
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
            ? {
                ...i,
                cantidad: data.cantidad ?? data.stock ?? stock,
                productoNombre: data.productoNombre || data.nombreProducto || i.productoNombre,
                sedeId: Number(data.sedeId || i.sedeId),
              }
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
        sedeId: Number(addSedeId),
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
      subtitle={allBranches ? 'All branches' : `Branch · ${currentBranch()}`}
    >
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
            className="mb-6 px-4 py-3 rounded-lg text-base font-medium border-l-4"
            style={{ background: '#dcfce7', borderColor: '#15803d', color: '#14532d' }}
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
        ) : (
          <div className="space-y-8">
            {(allBranches ? branchList : [{ id: Number(sedeId), nombre: currentBranch() }]).map((group) => {
              const rows = filtered.filter((i) => Number(i.sedeId) === Number(group.id));
              return (
                <section key={group.id}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-2xl" style={{ color: '#f7f2e9' }}>
                      {branchLabel(group.nombre)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setAddSedeId(group.id);
                        setAddProductoId('');
                        setAddOpen(true);
                        setError('');
                      }}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ background: '#926208', color: '#071525' }}
                    >
                      Add to inventory
                    </button>
                  </div>
                  {rows.length === 0 ? (
                    <p className="text-sm text-gray-400">No products in inventory at this branch.</p>
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
                          {rows.map((it) => {
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
                </section>
              );
            })}
          </div>
        )}

      {addOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-2" style={{ color: '#f7f2e9' }}>
              Add to inventory
            </h3>
            <p className="text-sm mb-3" style={{ color: '#c9a227' }}>
              {branchLabel(branchList.find((b) => b.id === addSedeId)?.nombre) || currentBranch()}
            </p>
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
                {disponibles.length === 0 ? (
                  <option value="">No catalog products left for this branch</option>
                ) : (
                  disponibles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))
                )}
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
