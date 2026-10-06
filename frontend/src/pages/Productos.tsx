import { useEffect, useState } from 'react';
import api, { categoriaProducto } from '../api/api';
import Navbar from '../components/Navbar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { Producto } from '../types';

type Category = 'all' | 'beer' | 'aguardiente' | 'rum' | 'whisky' | 'tequila' | 'wine';

const LABELS: Record<Category, string> = {
  all: 'All',
  beer: 'Beers',
  aguardiente: 'Aguardiente',
  rum: 'Rums',
  whisky: 'Whisky',
  tequila: 'Tequila/Vodka',
  wine: 'Wines',
};

const translateCategory = (cat: string): Category => {
  const map: Record<string, Category> = {
    cerveza: 'beer',
    aguardiente: 'aguardiente',
    ron: 'rum',
    whisky: 'whisky',
    tequila: 'tequila',
    vino: 'wine',
  };
  return map[cat] || 'beer';
};

export default function Productos() {
  useInactivityLogout();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category>('all');

  useEffect(() => {
    api
      .get('/api/products')
      .then((r) => setProductos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cat = (p: Producto): Category =>
    translateCategory(p.categoria || categoriaProducto(p.nombre));

  const filtered = productos.filter((p) =>
    filter === 'all' ? true : cat(p) === filter
  );

  const count = (c: Category) =>
    c === 'all' ? productos.length : productos.filter((p) => cat(p) === c).length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <p
            className="text-xs uppercase tracking-widest text-gray-500 mb-2"
            style={{ letterSpacing: '0.15em' }}
          >
            Liquor menu · bottles only
          </p>
          <h1
            className="font-display text-4xl"
            style={{ color: 'var(--bar-dark)' }}
          >
            Our selection
          </h1>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {(Object.keys(LABELS) as Category[]).map((c) => {
            const active = filter === c;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className="px-4 py-2 rounded-full border whitespace-nowrap text-sm transition-all"
                style={{
                  background: active ? 'var(--bar-dark)' : 'white',
                  color: active ? 'var(--bar-gold)' : '#555',
                  borderColor: active ? 'var(--bar-dark)' : 'rgba(0,0,0,0.1)',
                }}
              >
                {LABELS[c]} ({count(c)})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border p-5 hover:shadow-lg transition-all relative"
                style={{ background: 'white', borderColor: 'rgba(212,162,76,0.35)' }}
              >
                <div className="flex justify-end mb-2">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,44,44,0.08)', color: 'var(--bar-red)' }}
                  >
                    +18
                  </span>
                </div>

                <h3 className="font-medium text-gray-800 mb-3 leading-tight min-h-[2.5rem]">
                  {p.nombre}
                </h3>

                <p
                  className="font-display text-2xl"
                  style={{ color: 'var(--bar-dark)' }}
                >
                  ${p.precio?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}