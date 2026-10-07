import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

interface Pedido {
  id: number;
  mesaId: number;
  estado: string;
  total: number;
}

interface Mesa {
  id: number;
  numero: number;
  estado: string;
  sedeId: number;
}

export default function PedidosActivos() {
  useInactivityLogout();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const sedeId = localStorage.getItem('sedeId') || '1';

  useEffect(() => {
    Promise.all([
      api.get(`/api/orders?sedeId=${sedeId}`),
      api.get(`/api/tables?sedeId=${sedeId}`),
    ])
      .then(([rPedidos, rMesas]) => {
        setPedidos(rPedidos.data);
        setMesas(rMesas.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sedeId]);

  // Convierte el id de la mesa a su numero visible
  const numeroMesa = (mesaId: number) => {
    const m = mesas.find((x) => x.id === mesaId);
    return m ? m.numero : mesaId;
  };

  const estadoConfig = (estado: string) => {
    const e = estado?.toUpperCase();
    if (e === 'ABIERTO' || e === 'PENDIENTE') return { bg: '#fff8e1', color: '#e65100', label: 'Open' };
    if (e === 'PREPARANDO') return { bg: '#e3f2fd', color: '#0d47a1', label: 'Preparing' };
    if (e === 'LISTO') return { bg: '#e8f5e9', color: '#1b5e20', label: 'Ready' };
    if (e === 'CANCELADO') return { bg: '#ffebee', color: '#b71c1c', label: 'Cancelled' };
    if (e === 'CERRADO') return { bg: '#f5f5f5', color: '#616161', label: 'Closed' };
    return { bg: '#f5f5f5', color: '#616161', label: estado || 'No status' };
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
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
              Pedidos activos
            </h1>
          </div>
          <button
            onClick={() => navigate('/mesera/mesas')}
            className="text-sm px-4 py-2 rounded-lg text-white transition-all hover:translate-y-[-1px]"
            style={{ background: 'var(--bar-dark)' }}
          >
            + New order
          </button>
        </header>

        {loading ? (
          <p className="text-gray-400">Loading orders...</p>
        ) : pedidos.length === 0 ? (
          <div
            className="text-center py-20 border-2 border-dashed rounded-xl"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <p className="text-gray-400 mb-4">
              There are no active orders right now.
            </p>
            <button
              onClick={() => navigate('/mesera/mesas')}
              className="text-sm px-4 py-2 rounded-lg text-white"
              style={{ background: 'var(--bar-dark)' }}
            >
              Go to tables
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidos.map((p) => {
              const cfg = estadoConfig(p.estado);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border p-5"
                  style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p
                      className="font-display text-2xl"
                      style={{ color: 'var(--bar-dark)' }}
                    >
                      #{p.id}
                    </p>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Table</span>
                      <span className="font-medium text-gray-800">
                        {numeroMesa(p.mesaId)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total</span>
                      <span
                        className="font-display text-lg"
                        style={{ color: 'var(--bar-gold)' }}
                      >
                        ${p.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}