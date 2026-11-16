import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import PageShell from '../components/PageShell';
import AppLayout from '../components/AppLayout';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import { branchLabel, currentBranch, formatMoney, isAdminAllBranches } from '../lib/format';

interface Pedido {
  id: number;
  mesaId: number;
  sedeId?: number;
  sedeNombre?: string;
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
  const allBranches = isAdminAllBranches();

  useEffect(() => {
    api
      .get('/api/branches')
      .then((r) => {
        const list = (Array.isArray(r.data) ? r.data : []).filter(
          (b: { id: number; nombre: string }) => !/cantina/i.test(b.nombre || '')
        ) as { id: number; nombre: string }[];
        const targets = allBranches && list.length > 0 ? list : [{ id: Number(sedeId), nombre: '' }];
        return Promise.all(
          targets.map((b) =>
            Promise.all([
              api.get(`/api/orders?sedeId=${b.id}`).then((o) => {
                const rows: Pedido[] = Array.isArray(o.data) ? o.data : [];
                return rows.map((p) => ({ ...p, sedeId: p.sedeId || b.id, sedeNombre: b.nombre }));
              }).catch(() => [] as Pedido[]),
              api.get(`/api/tables?sedeId=${b.id}`).then((t) => (Array.isArray(t.data) ? t.data : [])).catch(() => [] as Mesa[]),
            ])
          )
        );
      })
      .then((groups) => {
        setPedidos(groups.flatMap((g) => g[0]));
        setMesas(groups.flatMap((g) => g[1]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sedeId, allBranches]);

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
    <PageShell>
    <AppLayout
      eyebrow="Welcome to Terraza Premium"
      title="Active orders"
      subtitle={allBranches ? 'All branches' : `Branch · ${currentBranch()}`}
    >
          <div className="mb-8 flex justify-end">
          <button
            onClick={() => navigate('/mesera/mesas')}
            className="text-sm px-4 py-2 rounded-lg transition-all"
            style={{ background: '#926208', color: '#071525' }}
          >
            + New order
          </button>
          </div>

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
              style={{ background: '#926208', color: '#071525' }}
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
                  className="rounded-xl border p-5"
                  style={{ background: '#10243d', borderColor: 'rgba(146, 98, 8,0.22)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p
                      className="font-display text-2xl"
                      style={{ color: '#f7f2e9' }}
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
                    {allBranches && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Branch</span>
                      <span className="font-medium" style={{ color: '#f7f2e9' }}>
                        {branchLabel(p.sedeNombre) || '—'}
                      </span>
                    </div>
                    )}
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
                        {formatMoney(p.total)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </AppLayout>
    </PageShell>
  );
}