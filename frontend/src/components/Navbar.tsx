import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/api';
import ConfirmDialog from './ConfirmDialog';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [askLogout, setAskLogout] = useState(false);

  const logout = async () => {
    setAskLogout(false);
    try {
      await api.post('/api/auth/logout');
    } catch {}
    localStorage.clear();
    navigate('/login');
  };

  const esAdmin = localStorage.getItem('rol') === 'ADMIN';
  const esCajero = localStorage.getItem('rol') === 'CAJERO';
  const items = esCajero
    ? [
        { label: 'Cashier', path: '/cajero/dashboard' },
        { label: 'Inventory', path: '/mesera/inventario' },
      ]
    : [
        { label: 'Tables', path: '/mesera/mesas' },
        { label: 'Orders', path: '/mesera/pedidos' },
        { label: 'Menu', path: '/mesera/productos' },
        ...(esAdmin
          ? [
              { label: 'Inventory', path: '/mesera/inventario' },
              { label: 'Admin', path: '/admin/dashboard' },
            ]
          : []),
      ];

  return (
    <>
    <header
      className="sticky top-0 z-40 border-b"
      style={{ background: 'var(--bar-dark)', borderColor: 'rgba(212,162,76,0.15)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <button
          onClick={() => navigate(esCajero ? '/cajero/dashboard' : '/mesera/mesas')}
          className="flex items-center gap-3 shrink-0"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
               stroke="var(--bar-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
          </svg>
          <div className="text-left hidden sm:block">
            <p className="font-display text-white text-lg leading-none">Terraza Premium</p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5"
               style={{ letterSpacing: '0.25em', color: 'var(--bar-gold)' }}>
              {esAdmin ? 'Bar · Admin' : esCajero ? 'Bar · Cashier' : 'Bar · Waiter'}
            </p>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {items.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="px-4 py-2 text-sm rounded-md transition-colors"
                style={{
                  color: active ? 'var(--bar-gold)' : 'rgba(255,255,255,0.65)',
                  background: active ? 'rgba(212,162,76,0.1)' : 'transparent',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-white/70 text-xs">{localStorage.getItem('email')}</p>
            <p className="text-[10px] uppercase tracking-widest"
               style={{ color: 'var(--bar-gold)' }}>
              {esAdmin ? 'Administrator' : esCajero ? 'Cashier' : 'Waiter'}
            </p>
          </div>
          <button
            onClick={() => setAskLogout(true)}
            className="text-white/60 hover:text-white text-sm transition-colors border rounded-md px-3 py-1.5"
            style={{ borderColor: 'rgba(212,162,76,0.3)' }}
          >
            Sign out
          </button>
        </div>
      </div>

      <nav className="md:hidden flex border-t overflow-x-auto"
           style={{ borderColor: 'rgba(212,162,76,0.15)' }}>
        {items.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex-1 py-3 text-xs whitespace-nowrap transition-colors"
              style={{
                color: active ? 'var(--bar-gold)' : 'rgba(255,255,255,0.6)',
                borderBottom: active ? '2px solid var(--bar-gold)' : '2px solid transparent',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
      <ConfirmDialog
        open={askLogout}
        title="Sign out"
        message="Close this session?"
        confirmLabel="Sign out"
        onConfirm={logout}
        onCancel={() => setAskLogout(false)}
      />
    </>
  );
}