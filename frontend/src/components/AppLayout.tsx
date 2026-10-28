import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import barBanner from '../assets/bar-banner.png';
import cocktailMark from '../assets/cocktail-mark.png';
import cocktailWatermark from '../assets/cocktail-watermark.jpg';
import BranchSwitcher from './BranchSwitcher';
import ConfirmDialog from './ConfirmDialog';
import './app-layout.css';

function roleName() {
  const rol = localStorage.getItem('rol');
  if (rol === 'ADMIN') return 'Administrator';
  if (rol === 'CAJERO') return 'Cashier';
  return 'Waiter';
}

function navItems() {
  const rol = localStorage.getItem('rol');
  if (rol === 'ADMIN') {
    return [
      { label: 'Administration', path: '/admin/dashboard' },
      { label: 'Inventory', path: '/mesera/inventario' },
      { label: 'Work as waiter', path: '/mesera/mesas' },
      { label: 'Work as cashier', path: '/cajero/dashboard' },
    ];
  }
  if (rol === 'CAJERO') {
    return [
      { label: 'Cashier', path: '/cajero/dashboard' },
      { label: 'Inventory', path: '/mesera/inventario' },
    ];
  }
  return [
    { label: 'Tables', path: '/mesera/mesas' },
    { label: 'Orders', path: '/mesera/pedidos' },
    { label: 'Menu', path: '/mesera/productos' },
  ];
}

export default function AppLayout({
  eyebrow,
  title,
  subtitle,
  banner = true,
  extraNav,
  metrics,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  banner?: boolean;
  extraNav?: ReactNode;
  metrics?: { label: string; value: string | number }[];
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [askLogout, setAskLogout] = useState(false);
  const items = navItems();

  const logout = async () => {
    setAskLogout(false);
    try {
      await api.post('/api/auth/logout');
    } catch {}
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="app-layout">
      <aside className="app-side">
        <div className="app-side-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#926208" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
          </svg>
          <div>
            <strong>Terraza</strong>
            <span>Premium</span>
          </div>
        </div>
        <p className="app-side-role">{roleName() === 'Administrator' ? 'Administration' : roleName()}</p>
        {extraNav}
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`app-nav-btn${isActive(item.path) ? ' is-active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
        <div className="app-mark">
          <img src={cocktailWatermark} alt="" />
          <p>The best moments<br />are shared here</p>
        </div>
      </aside>

      <div className="app-main">
        <div className="app-top">
          <p className="text-[14px] uppercase tracking-widest font-semibold" style={{ color: '#f7f2e9' }}>
            Terraza Premium
          </p>
          <div className="flex items-center gap-4">
            <BranchSwitcher />
            <div className="hidden md:flex flex-col items-end">
              <p className="text-white text-sm">{localStorage.getItem('email')}</p>
              <p className="text-[12px] uppercase tracking-widest font-medium" style={{ color: '#c9a227' }}>
                {roleName()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAskLogout(true)}
              className="text-white text-[15px] border rounded-md px-3 py-1.5"
              style={{ borderColor: 'rgba(146, 98, 8,0.4)' }}
            >
              Sign out
            </button>
          </div>
        </div>

        <nav className="app-mobile-nav">
          {items.map((item) => (
            <button
              key={item.path}
              type="button"
              className={isActive(item.path) ? 'is-active' : ''}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {banner && (
          <section className="app-banner">
            <img className="app-banner-bg" src={barBanner} alt="" />
            <div className="app-banner-shade" />
            <div className="app-banner-copy">
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              {subtitle ? <p className="sub">{subtitle}</p> : null}
            </div>
            <p className="app-banner-script">Great experiences,<br />better moments</p>
          </section>
        )}

        <div className="app-body">
          {metrics && metrics.length > 0 && (
            <div className="app-metrics">
              {metrics.map((m) => (
                <div key={m.label} className="app-metric">
                  <span>{m.label}</span>
                  <strong>{m.value}</strong>
                </div>
              ))}
            </div>
          )}
          {children}
          <div className="app-promo">
            <img src={cocktailMark} alt="" />
            <div className="app-promo-shade" />
            <div className="app-promo-copy">
              <p>Excellence is also managed.</p>
              <span>Terraza Premium</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={askLogout}
        title="Sign out"
        message="Close this session?"
        confirmLabel="Sign out"
        onConfirm={logout}
        onCancel={() => setAskLogout(false)}
      />
    </div>
  );
}
