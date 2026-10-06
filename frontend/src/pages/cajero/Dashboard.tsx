import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

interface Proveedor {
  id: number;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
}

interface Pedido {
  id: number;
  mesaId: number;
  estado: string;
  total: number;
}

type Tab = 'pedidos' | 'proveedores';

export default function Dashboard() {
  useInactivityLogout();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pedidos');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const [pagoModal, setPagoModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [monto, setMonto] = useState('');
  const [cambio, setCambio] = useState('');

  const sedeId = localStorage.getItem('sedeId') || '1';
  const cajeroId = localStorage.getItem('usuarioId') || '3';

  const cargarDatos = () => {
    setLoading(true);
    Promise.all([
      api.get(`/api/orders?sedeId=${sedeId}`).catch(() => ({ data: [] })),
      api.get('/api/proveedores').catch(() => ({ data: [] })),
    ])
      .then(([rP, rProv]) => {
        setPedidos(Array.isArray(rP.data) ? rP.data : []);
        setProveedores(Array.isArray(rProv.data) ? rProv.data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarDatos();
  }, [sedeId]);

  const cerrarSesion = async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    try {
      await api.post('/api/auth/logout');
    } catch {}
    localStorage.clear();
    navigate('/login');
  };

  const abrirPago = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setMetodoPago('EFECTIVO');
    setMonto(String(pedido.total));
    setCambio('0');
    setPagoModal(true);
    setError('');
    setMensaje('');
  };

  const registrarPago = async () => {
    if (!pedidoSeleccionado) return;
    if (!monto || Number(monto) < pedidoSeleccionado.total) {
      setError('El monto debe ser mayor o igual al total del pedido');
      return;
    }

    try {
      const body = {
        pedidoId: pedidoSeleccionado.id,
        cajeroId: Number(cajeroId),
        metodoPago,
        monto: Number(monto),
        cambio: Number(cambio) || 0,
      };

      await api.post('/api/pagos', body);
      setMensaje(`Pago registrado. Pedido #${pedidoSeleccionado.id} cerrado.`);
      setPagoModal(false);
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al registrar el pago');
    }
  };

  const estadoConfig = (estado: string) => {
    const e = estado?.toUpperCase();
    if (e === 'ABIERTO') return { bg: '#fff8e1', color: '#e65100', label: 'Abierto' };
    if (e === 'CERRADO') return { bg: '#e8f5e9', color: '#1b5e20', label: 'Cerrado' };
    if (e === 'CANCELADO') return { bg: '#ffebee', color: '#b71c1c', label: 'Cancelado' };
    return { bg: '#f5f5f5', color: '#616161', label: estado };
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'var(--bar-dark)', borderColor: 'rgba(212,162,76,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="var(--bar-gold)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
            </svg>
            <div>
              <p className="font-display text-white text-lg leading-none">Terraza Premium</p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5"
                 style={{ letterSpacing: '0.25em', color: 'var(--bar-gold)' }}>
                Cajero
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-white/70 text-xs">{localStorage.getItem('email')}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--bar-gold)' }}>
                Cajero
              </p>
            </div>
            <button
              onClick={cerrarSesion}
              className="text-white/60 hover:text-white text-sm transition-colors border rounded-md px-3 py-1.5"
              style={{ borderColor: 'rgba(212,162,76,0.3)' }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2"
             style={{ letterSpacing: '0.15em' }}>
            Panel de caja
          </p>
          <h1 className="font-display text-4xl" style={{ color: 'var(--bar-dark)' }}>
            Bienvenido, Cajero
          </h1>
        </header>

        {mensaje && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
               style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534' }}>
            {mensaje}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {([
            { key: 'pedidos', label: `Pedidos (${pedidos.length})` },
            { key: 'proveedores', label: `Proveedores (${proveedores.length})` },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-lg border text-sm transition-all"
              style={{
                background: tab === t.key ? 'var(--bar-dark)' : 'white',
                color: tab === t.key ? 'var(--bar-gold)' : '#555',
                borderColor: tab === t.key ? 'var(--bar-dark)' : 'rgba(0,0,0,0.1)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Cargando datos...</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden"
               style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {tab === 'pedidos' && (
              pedidos.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400">No hay pedidos registrados</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Pedido</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Mesa</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Estado</th>
                      <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Total</th>
                      <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => {
                      const cfg = estadoConfig(p.estado);
                      return (
                        <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                          <td className="px-6 py-4 font-medium">#{p.id}</td>
                          <td className="px-6 py-4 text-sm">Mesa {p.mesaId}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                                  style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-display"
                              style={{ color: 'var(--bar-amber)' }}>
                            ${p.total?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {p.estado === 'ABIERTO' && (
                              <button
                                onClick={() => abrirPago(p)}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all hover:translate-y-[-1px]"
                                style={{ background: 'var(--bar-dark)' }}
                              >
                                Cobrar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}

            {tab === 'proveedores' && (
              proveedores.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400">No hay proveedores registrados</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Nombre</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">NIT</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Contacto</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((p) => (
                      <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                        <td className="px-6 py-4 font-medium">{p.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.nit}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.contacto}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{p.telefono}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        )}
      </main>

      {pagoModal && pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
              Registrar pago
            </h3>

            <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--bar-cream)' }}>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Pedido</p>
              <p className="font-medium">#{pedidoSeleccionado.id} · Mesa {pedidoSeleccionado.mesaId}</p>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-3 mb-1">Total</p>
              <p className="font-display text-3xl" style={{ color: 'var(--bar-amber)' }}>
                ${pedidoSeleccionado.total?.toLocaleString()}
              </p>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm"
                   style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}

            <label className="block mb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                Método de pago
              </span>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA_CREDITO">Tarjeta de crédito</option>
                <option value="TARJETA_DEBITO">Tarjeta de débito</option>
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                Monto recibido
              </span>
              <input
                type="number"
                value={monto}
                onChange={(e) => {
                  setMonto(e.target.value);
                  const c = Number(e.target.value) - pedidoSeleccionado.total;
                  setCambio(String(c > 0 ? c : 0));
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border bg-white"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              />
            </label>

            {metodoPago === 'EFECTIVO' && (
              <label className="block mb-4">
                <span className="text-xs font-medium uppercase tracking-widest text-gray-600">
                  Cambio
                </span>
                <input
                  type="number"
                  value={cambio}
                  readOnly
                  className="mt-1 w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'rgba(0,0,0,0.15)', background: '#f9f9f9' }}
                />
              </label>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setPagoModal(false)}
                className="flex-1 py-3 rounded-lg border font-medium text-sm text-gray-600 hover:bg-gray-50"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              >
                Cancelar
              </button>
              <button
                onClick={registrarPago}
                className="flex-1 py-3 rounded-lg text-white font-medium text-sm transition-all hover:translate-y-[-1px]"
                style={{ background: 'var(--bar-dark)' }}
              >
                Cobrar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}