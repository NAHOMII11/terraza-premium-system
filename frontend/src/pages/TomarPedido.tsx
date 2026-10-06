import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { categoriaProducto } from '../api/api';
import Navbar from '../components/Navbar';
import { useInactivityLogout } from '../hooks/useInactivityLogout';
import type { Producto } from '../types';

interface ItemCarrito {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default function TomarPedido() {
  useInactivityLogout();
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mesaOcupada, setMesaOcupada] = useState(false);
  const sedeId = Number(localStorage.getItem('sedeId') || 1);

  useEffect(() => {
    api
      .get('/api/products')
      .then((r) => setProductos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api
      .get(`/api/tables?sedeId=${sedeId}`)
      .then((r) => {
        const mesa = r.data.find((m: any) => m.id === Number(mesaId));
        if (mesa && mesa.estado === 'OCUPADA') setMesaOcupada(true);
      })
      .catch(() => {});
  }, [mesaId, sedeId]);

  const agregar = (p: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.productoId === p.id);
      if (existe) {
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 },
      ];
    });
  };

  const quitar = (id: number) => {
    setCarrito((prev) =>
      prev
        .map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0)
    );
  };

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const filtrados = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const guardar = async () => {
    if (carrito.length === 0) return alert('Agrega al menos una botella');
    if (guardando) return;

    setGuardando(true);
    try {
      const body = {
        mesaId: Number(mesaId),
        sedeId,
        items: carrito.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
        })),
      };

      await api.post('/api/orders', body);
      alert('Pedido guardado. La mesa queda OCUPADA.');
      navigate('/mesera/mesas');
    } catch {
      alert('Error al guardar el pedido');
    } finally {
      setGuardando(false);
    }
  };

  const liberarMesa = async () => {
    if (!confirm('¿Liberar esta mesa? Quedará disponible para nuevos clientes.')) return;

    try {
      const { data: pedidos } = await api.get(`/api/orders?sedeId=${sedeId}`);
      const pedidoActivo = pedidos.find(
        (p: any) =>
          p.mesaId === Number(mesaId) &&
          p.estado !== 'CANCELADO' &&
          p.estado !== 'CERRADO'
      );

      if (pedidoActivo) {
        await api.put(`/api/orders/${pedidoActivo.id}`, { estado: 'CERRADO' });
      } else {
        await api.put(`/api/tables/${mesaId}`, { estado: 'LIBRE' });
      }

      alert('Mesa liberada.');
      navigate('/mesera/mesas');
    } catch {
      alert('Error al liberar la mesa');
    }
  };

  // ==================== MESA OCUPADA ====================
  if (mesaOcupada) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
        <Navbar />

        <main className="max-w-2xl mx-auto px-6 py-16">
          <button
            onClick={() => navigate('/mesera/mesas')}
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 mb-8 flex items-center gap-1"
            style={{ letterSpacing: '0.15em' }}
          >
            ← Volver a mesas
          </button>

          <div className="bg-white rounded-2xl border p-8 text-center"
               style={{ borderColor: 'rgba(212,162,76,0.35)' }}>

            <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
                 style={{ background: '#ffebee' }}>
              <span className="w-3 h-3 rounded-full" style={{ background: '#ef5350' }} />
            </div>

            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2"
               style={{ letterSpacing: '0.15em' }}>
              Mesa {mesaId}
            </p>
            <h1 className="font-display text-4xl mb-3" style={{ color: 'var(--bar-dark)' }}>
              Esta mesa está ocupada
            </h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Ya tiene un pedido activo. Si el cliente terminó y se retiró,
              puedes liberar la mesa para nuevos clientes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/mesera/mesas')}
                className="px-6 py-3 rounded-lg border font-medium text-sm
                           text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              >
                Volver
              </button>
              <button
                onClick={liberarMesa}
                className="px-6 py-3 rounded-lg text-white font-medium text-sm
                           transition-all hover:translate-y-[-1px]"
                style={{ background: '#b71c1c' }}
              >
                Liberar mesa
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==================== MESA LIBRE → TOMAR PEDIDO ====================
  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <button
            onClick={() => navigate('/mesera/mesas')}
            className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-800 mb-2 flex items-center gap-1"
            style={{ letterSpacing: '0.15em' }}
          >
            ← Volver a mesas
          </button>
          <h1 className="font-display text-4xl" style={{ color: 'var(--bar-dark)' }}>
            Mesa {mesaId}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Nueva comanda · disponible</p>
        </header>

        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-3">
            <input
              type="text"
              placeholder="Buscar botella..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full mb-4 px-4 py-2.5 rounded-lg border bg-white
                         focus:outline-none focus:ring-2"
              style={{ borderColor: 'rgba(0,0,0,0.1)' }}
            />

            {loading ? (
              <p className="text-gray-400">Cargando carta...</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filtrados.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => agregar(p)}
                    className="bg-white border rounded-xl p-4 text-left
                               hover:shadow-md hover:-translate-y-0.5 transition-all relative"
                    style={{ borderColor: 'rgba(212,162,76,0.35)' }}
                  >
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                         style={{ background: 'rgba(139,44,44,0.08)', color: 'var(--bar-red)' }}>
                      +18
                    </div>

                    <p className="font-medium text-gray-800 text-sm pr-8">{p.nombre}</p>
                    <p className="font-display text-xl mt-1" style={{ color: 'var(--bar-gold)' }}>
                      ${p.precio?.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:col-span-2">
            <div className="bg-white rounded-xl border sticky top-24"
                 style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <p className="text-xs uppercase tracking-widest text-gray-500"
                   style={{ letterSpacing: '0.15em' }}>
                  Nueva comanda
                </p>
              </div>

              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {carrito.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">
                    Aún no hay botellas.<br />Toca una para agregarla.
                  </p>
                ) : (
                  carrito.map((i) => (
                    <div key={i.productoId}
                         className="flex justify-between items-center py-3 border-b last:border-0"
                         style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">{i.nombre}</p>
                        <p className="text-xs text-gray-500">
                          ${i.precio?.toLocaleString()} × {i.cantidad}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => quitar(i.productoId)}
                          className="w-7 h-7 rounded border flex items-center justify-center
                                     hover:bg-gray-100 transition-colors text-gray-600"
                          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{i.cantidad}</span>
                        <button
                          onClick={() =>
                            agregar({
                              id: i.productoId,
                              nombre: i.nombre,
                              precio: i.precio,
                              tipoProductoId: 0,
                            })
                          }
                          className="w-7 h-7 rounded border flex items-center justify-center
                                     hover:bg-gray-100 transition-colors text-gray-600"
                          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs uppercase tracking-widest text-gray-500">Total</span>
                  <span className="font-display text-3xl" style={{ color: 'var(--bar-dark)' }}>
                    ${total.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/mesera/mesas')}
                    className="flex-1 py-3 rounded-lg border font-medium text-sm
                               text-gray-600 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: 'rgba(0,0,0,0.15)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardar}
                    disabled={carrito.length === 0 || guardando}
                    className="flex-1 py-3 rounded-lg text-white font-medium text-sm
                               transition-all disabled:opacity-40 hover:translate-y-[-1px]"
                    style={{ background: 'var(--bar-dark)' }}
                  >
                    {guardando ? 'Guardando...' : 'Enviar a mesa'}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}