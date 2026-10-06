import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { Mesa } from '../types';

export default function Mesas() {
  useInactivityLogout();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const sedeId = localStorage.getItem('sedeId') || '1';

  const cargarMesas = () => {
    setLoading(true);
    api
      .get(`/api/tables?sedeId=${sedeId}`)
      .then((r) => setMesas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarMesas();
  }, [sedeId]);

  const esDisponible = (estado: string) =>
    estado === 'DISPONIBLE' || estado === 'LIBRE';
  const esOcupada = (estado: string) => estado === 'OCUPADA';

  const estadoConfig = (estado: string) => {
    if (esOcupada(estado)) {
      return {
        bg: '#ffebee',
        border: '#ef9a9a',
        text: '#b71c1c',
        dot: '#ef5350',
        label: 'Ocupada',
      };
    }
    return {
      bg: '#e8f5e9',
      border: '#a5d6a7',
      text: '#1b5e20',
      dot: '#4caf50',
      label: 'Disponible',
    };
  };

  const libres = mesas.filter((m) => esDisponible(m.estado)).length;
  const ocupadas = mesas.filter((m) => esOcupada(m.estado)).length;

  const liberarMesa = async (mesaId: number, numero: number) => {
    if (!confirm(`¿Liberar la mesa ${numero}? Quedará disponible.`)) return;

    try {
      const { data: pedidos } = await api.get(`/api/orders?sedeId=${sedeId}`);
      const pedidoActivo = pedidos.find(
        (p: any) =>
          p.mesaId === mesaId &&
          p.estado !== 'CANCELADO' &&
          p.estado !== 'CERRADO'
      );

      if (pedidoActivo) {
        await api.put(`/api/orders/${pedidoActivo.id}`, { estado: 'CERRADO' });
      } else {
        await api.put(`/api/tables/${mesaId}`, { estado: 'DISPONIBLE' });
      }

      cargarMesas();
    } catch {
      alert('Error al liberar la mesa');
    }
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
              Salón · Sede {sedeId}
            </p>
            <h1
              className="font-display text-4xl"
              style={{ color: 'var(--bar-dark)' }}
            >
              Estado de mesas
            </h1>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Disponibles
              </p>
              <p className="font-display text-3xl" style={{ color: '#1b5e20' }}>
                {libres}
              </p>
            </div>
            <div
              className="border-l pl-6"
              style={{ borderColor: 'rgba(0,0,0,0.1)' }}
            >
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Ocupadas
              </p>
              <p className="font-display text-3xl" style={{ color: '#b71c1c' }}>
                {ocupadas}
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <p className="text-gray-400">Cargando mesas...</p>
        ) : mesas.length === 0 ? (
          <div
            className="text-center py-20 border-2 border-dashed rounded-xl"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <p className="text-gray-400">
              No hay mesas registradas en esta sede.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mesas.map((mesa, index) => {
              const cfg = estadoConfig(mesa.estado);
              const ocupada = esOcupada(mesa.estado);
              // Número visible: usa el numero real de la BD, o el index+1 como fallback
              const numeroVisible = mesa.numero || index + 1;
              return (
                <div
                  key={mesa.id}
                  className="group relative rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                  style={{ background: cfg.bg, borderColor: cfg.border }}
                >
                  <button
                    onClick={() =>
                      navigate(
                        `/mesera/pedido/${mesa.id}?numero=${numeroVisible}`
                      )
                    }
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs uppercase tracking-widest font-medium"
                        style={{ color: cfg.text, letterSpacing: '0.1em' }}
                      >
                        Mesa
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: cfg.dot }}
                      />
                    </div>
                    <p
                      className="font-display text-4xl mb-1"
                      style={{ color: cfg.text }}
                    >
                      {String(numeroVisible).padStart(2, '0')}
                    </p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: cfg.text }}
                    >
                      {cfg.label}
                    </p>
                  </button>

                  {ocupada ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        liberarMesa(mesa.id, numeroVisible);
                      }}
                      className="w-full py-2 text-[10px] uppercase tracking-widest font-semibold border-t transition-colors hover:bg-red-100"
                      style={{
                        background: 'rgba(183,28,28,0.08)',
                        borderColor: cfg.border,
                        color: cfg.text,
                        letterSpacing: '0.15em',
                      }}
                    >
                      Liberar mesa
                    </button>
                  ) : (
                    <div
                      className="px-6 py-3 border-t flex items-center justify-between text-[10px] uppercase tracking-widest opacity-60"
                      style={{ borderColor: cfg.border, color: cfg.text }}
                    >
                      <span>Tomar pedido</span>
                      <span>→</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}