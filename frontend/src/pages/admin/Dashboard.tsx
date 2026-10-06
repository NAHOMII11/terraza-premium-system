import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  sede: string;
}

interface Branch {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
}

interface Product {
  id: number;
  nombre: string;
  valorVenta: number;
  precio: number;
}

type Tab = 'users' | 'branches' | 'products';

export default function Dashboard() {
  useInactivityLogout();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/users').catch(() => ({ data: [] })),
      api.get('/api/branches').catch(() => ({ data: [] })),
      api.get('/api/products').catch(() => ({ data: [] })),
    ])
      .then(([rU, rB, rP]) => {
        setUsers(Array.isArray(rU.data) ? rU.data : []);
        setBranches(Array.isArray(rB.data) ? rB.data : []);
        setProducts(Array.isArray(rP.data) ? rP.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    if (!confirm('Close session?')) return;
    try {
      await api.post('/api/auth/logout');
    } catch {}
    localStorage.clear();
    navigate('/login');
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
                Admin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-white/70 text-xs">{localStorage.getItem('email')}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--bar-gold)' }}>
                Administrator
              </p>
            </div>
            <button
              onClick={logout}
              className="text-white/60 hover:text-white text-sm transition-colors border rounded-md px-3 py-1.5"
              style={{ borderColor: 'rgba(212,162,76,0.3)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2"
             style={{ letterSpacing: '0.15em' }}>
            Admin panel
          </p>
          <h1 className="font-display text-4xl" style={{ color: 'var(--bar-dark)' }}>
            Welcome, Administrator
          </h1>
        </header>

        <div className="flex gap-2 mb-6">
          {([
            { key: 'users', label: `Users (${users.length})` },
            { key: 'branches', label: `Branches (${branches.length})` },
            { key: 'products', label: `Products (${products.length})` },
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
          <p className="text-gray-400">Loading data...</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden"
               style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {tab === 'users' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Email</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Role</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{u.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ background: 'rgba(212,162,76,0.15)', color: 'var(--bar-amber)' }}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.sede}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'branches' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Address</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">City</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{b.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.direccion}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.ciudad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'products' && (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">ID</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                      <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                        <td className="px-6 py-3 text-sm text-gray-500">#{p.id}</td>
                        <td className="px-6 py-3">{p.nombre}</td>
                        <td className="px-6 py-3 text-right font-display"
                            style={{ color: 'var(--bar-amber)' }}>
                          ${(p.precio || p.valorVenta || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}