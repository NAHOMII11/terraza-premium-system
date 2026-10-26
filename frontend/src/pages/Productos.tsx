import { useEffect, useState } from 'react';
import api from '../api/api';
import PageShell from '../components/PageShell';
import AppLayout from '../components/AppLayout';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { Producto } from '../types';
import { currentBranch, formatMoney } from '../lib/format';

interface ProductType {
  id: number;
  nombre: string;
}

export default function Productos() {
  useInactivityLogout();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeId, setTypeId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/products'),
      api.get('/api/product-types').catch(() => ({ data: [] })),
    ])
      .then(([rP, rT]) => {
        setProductos(Array.isArray(rP.data) ? rP.data : []);
        setTypes(Array.isArray(rT.data) ? rT.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = productos.filter((p) => {
    const matchType = typeId === 'all' || Number(p.tipoProductoId) === typeId;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.nombre.toLowerCase().includes(q) || String((p as Producto & { codigo?: string }).codigo || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <PageShell>
    <AppLayout
      eyebrow="Welcome to Terraza Premium"
      title="Product catalog"
      subtitle={`Liquor menu · ${currentBranch()}`}
    >
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product..."
            className="w-full md:w-80 px-4 py-2.5 rounded-lg border bg-white"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <button
            type="button"
            onClick={() => setTypeId('all')}
            className="px-4 py-2 rounded-full border whitespace-nowrap text-sm"
            style={{
              background: typeId === 'all' ? '#926208' : 'transparent',
              color: typeId === 'all' ? '#071525' : '#f7f2e9',
              borderColor: 'rgba(146, 98, 8,0.4)',
            }}
          >
            All ({productos.length})
          </button>
          {types.map((t) => {
            const active = typeId === t.id;
            const n = productos.filter((p) => Number(p.tipoProductoId) === t.id).length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeId(t.id)}
                className="px-4 py-2 rounded-full border whitespace-nowrap text-sm"
                style={{
                  background: active ? '#926208' : 'transparent',
                  color: active ? '#071525' : '#f7f2e9',
                  borderColor: 'rgba(146, 98, 8,0.4)',
                }}
              >
                {t.nombre} ({n})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const extra = p as Producto & { codigo?: string; tipoNombre?: string; valorVenta?: number };
              return (
              <div
                key={p.id}
                className="rounded-xl border p-5 hover:shadow-lg transition-all relative"
                style={{ background: '#10243d', borderColor: 'rgba(146, 98, 8,0.28)' }}
              >
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#926208' }}>
                  {extra.tipoNombre || extra.codigo || 'Bottle'}
                </p>
                <h3 className="font-medium mb-3 leading-tight min-h-[2.5rem]" style={{ color: '#f7f2e9' }}>
                  {p.nombre}
                </h3>
                <p className="font-display text-2xl" style={{ color: '#926208' }}>
                  {formatMoney(p.precio || extra.valorVenta || 0)}
                </p>
              </div>
            );
            })}
          </div>
        )}
    </AppLayout>
    </PageShell>
  );
}
