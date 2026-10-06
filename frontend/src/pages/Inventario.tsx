import { useEffect, useState } from 'react';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { InventarioItem } from '../types';

export default function Inventario() {
  useInactivityLogout();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const sedeId = localStorage.getItem('sedeId') || '1';

  useEffect(() => {
    console.log('🔍 Cargando inventario para sede:', sedeId);
    api
      .get(`/api/inventory?sedeId=${sedeId}`)
      .then((r) => {
        console.log('✅ Inventario recibido:', r.data);
        console.log('📊 Total items:', r.data?.length || 0);
        setItems(Array.isArray(r.data) ? r.data : []);
      })
      .catch((err) => {
        console.error('❌ Error al cargar inventario:', err);
        setError(err.response?.data?.message || 'Error al cargar inventario');
      })
      .finally(() => setLoading(false));
  }, [sedeId]);

  const filtrados = items.filter((i) =>
    (i.productoNombre || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const nivelStock = (cantidad: number) => {
    if (cantidad > 20) return { label: 'Óptimo', color: '#1b5e20', bg: '#e8f5e9' };
    if (cantidad > 5) return { label: 'Moderado', color: '#e65100', bg: '#fff8e1' };
    return { label: 'Bajo', color: '#b71c1c', bg: '#ffebee' };
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
              Sede {sedeId}
            </p>
            <h1
              className="font-display text-4xl"
              style={{ color: 'var(--bar-dark)' }}
            >
              Inventario
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {filtrados.length} producto{filtrados.length !== 1 ? 's' : ''}
          </p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full md:w-80 px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          />
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm"
               style={{ background: '#fef2f2', color: '#991b1b' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Cargando inventario...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl"
               style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <p className="text-gray-400">No hay productos en el inventario.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden"
               style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-gray-500 font-medium">
                    Producto
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-widest text-gray-500 font-medium">
                    Existencias
                  </th>
                  <th className="text-right px-6 py-4 text-xs uppercase tracking-widest text-gray-500 font-medium hidden sm:table-cell">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((it) => {
                  const nivel = nivelStock(it.cantidad);
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
                          style={{ background: nivel.bg, color: nivel.color }}
                        >
                          {nivel.label}
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