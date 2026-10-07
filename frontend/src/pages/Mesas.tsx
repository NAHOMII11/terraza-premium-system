import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { Mesa } from '../types';

export default function Mesas() {
  useInactivityLogout();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [releaseTarget, setReleaseTarget] = useState<{ id: number; numero: number } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sedeId = localStorage.getItem('sedeId') || '1';

  useEffect(() => {
    const fromOrder = (location.state as { message?: string } | null)?.message;
    if (fromOrder) setMessage(fromOrder);
  }, [location.state]);

  const loadTables = () => {
    setLoading(true);
    api
      .get(`/api/tables?sedeId=${sedeId}`)
      .then((r) => setMesas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTables();
  }, [sedeId]);

  const isAvailable = (estado: string) =>
    estado === 'DISPONIBLE' || estado === 'LIBRE';
  const isOccupied = (estado: string) => estado === 'OCUPADA';

  const statusConfig = (estado: string) => {
    if (isOccupied(estado)) {
      return {
        bg: '#ffebee',
        border: '#ef9a9a',
        text: '#b71c1c',
        dot: '#ef5350',
        label: 'Occupied',
      };
    }
    return {
      bg: '#e8f5e9',
      border: '#a5d6a7',
      text: '#1b5e20',
      dot: '#4caf50',
      label: 'Available',
    };
  };

  const available = mesas.filter((m) => isAvailable(m.estado)).length;
  const occupied = mesas.filter((m) => isOccupied(m.estado)).length;

  const releaseTable = async () => {
    if (!releaseTarget) return;
    try {
      await api.put(`/api/tables/${releaseTarget.id}`, { estado: 'DISPONIBLE' });
      setReleaseTarget(null);
      setError('');
      setMessage(`Table ${releaseTarget.numero} is now available.`);
      loadTables();
    } catch (err: any) {
      setReleaseTarget(null);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Error releasing table'
      );
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
              Floor · Branch {sedeId}
            </p>
            <h1
              className="font-display text-4xl"
              style={{ color: 'var(--bar-dark)' }}
            >
              Table status
            </h1>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Available
              </p>
              <p className="font-display text-3xl" style={{ color: '#1b5e20' }}>
                {available}
              </p>
            </div>
            <div
              className="border-l pl-6"
              style={{ borderColor: 'rgba(0,0,0,0.1)' }}
            >
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Occupied
              </p>
              <p className="font-display text-3xl" style={{ color: '#b71c1c' }}>
                {occupied}
              </p>
            </div>
          </div>
        </header>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
               style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534' }}>
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm"
               style={{ background: '#fef2f2', color: '#991b1b' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading tables...</p>
        ) : mesas.length === 0 ? (
          <div
            className="text-center py-20 border-2 border-dashed rounded-xl"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <p className="text-gray-400">No tables registered at this branch.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mesas.map((mesa, index) => {
              const cfg = statusConfig(mesa.estado);
              const occ = isOccupied(mesa.estado);
              const visibleNumber = mesa.numero || index + 1;
              return (
                <div
                  key={mesa.id}
                  className="group relative rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                  style={{ background: cfg.bg, borderColor: cfg.border }}
                >
                  <button
                    onClick={() =>
                      navigate(`/mesera/pedido/${mesa.id}?numero=${visibleNumber}`)
                    }
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs uppercase tracking-widest font-medium"
                        style={{ color: cfg.text, letterSpacing: '0.1em' }}
                      >
                        Table
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
                      {String(visibleNumber).padStart(2, '0')}
                    </p>
                    <p
                      className="text-xs font-medium"
                      style={{ color: cfg.text }}
                    >
                      {cfg.label}
                    </p>
                  </button>

                  {occ ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReleaseTarget({ id: mesa.id, numero: visibleNumber });
                      }}
                      className="w-full py-2 text-[10px] uppercase tracking-widest font-semibold border-t transition-colors hover:bg-red-100"
                      style={{
                        background: 'rgba(183,28,28,0.08)',
                        borderColor: cfg.border,
                        color: cfg.text,
                        letterSpacing: '0.15em',
                      }}
                    >
                      Release table
                    </button>
                  ) : (
                    <div
                      className="px-6 py-3 border-t flex items-center justify-between text-[10px] uppercase tracking-widest opacity-60"
                      style={{ borderColor: cfg.border, color: cfg.text }}
                    >
                      <span>Take order</span>
                      <span>→</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <ConfirmDialog
        open={!!releaseTarget}
        title="Release table"
        message={`Release table ${releaseTarget?.numero}? It will become available.`}
        confirmLabel="Release"
        onConfirm={releaseTable}
        onCancel={() => setReleaseTarget(null)}
      />
    </div>
  );
}