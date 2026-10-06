import { useEffect, useState } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { InventarioItem } from '../types';

export default function Inventario() {
  useInactivityLogout();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const sedeId = localStorage.getItem('sedeId') || '1';

  useEffect(() => {
    api
      .get(`/api/inventory?sedeId=${sedeId}`)
      .then((r) => {
        setItems(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error('Error loading inventory:', err);
        setError(err.response?.data?.message || 'Error loading inventory');
      })
      .finally(() => setLoading(false));
  }, [sedeId]);

  const filtered = items.filter((i) =>
    (i.productoNombre || '').toLowerCase().includes(search.toLowerCase())
  );

  const stockLevel = (qty: number) => {
    if (qty > 20) return { label: 'Optimal', color: '#1b5e20', bg: '#e8f5e9' };
    if (qty > 5) return { label: 'Moderate', color: '#e65100', bg: '#fff8e1' };
    return { label: 'Low', color: '#b71c1c', bg: '#ffebee' };
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
          <p className="text-sm text-gray-500">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </p>
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const level = stockLevel(it.cantidad);
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
                        <span
                          className="font-display text-2xl"
                          style={{ color: 'var(--bar-dark)' }}
                        >
                          {it.cantidad}
                        </span>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}