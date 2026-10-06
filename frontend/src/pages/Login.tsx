import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('rol', data.rol);
      localStorage.setItem('email', email);
      if (data.sedeId) localStorage.setItem('sedeId', String(data.sedeId));

      if (data.rol === 'MESERA') navigate('/mesera/mesas');
      else if (data.rol === 'ADMIN') navigate('/');
      else if (data.rol === 'CAJERO') navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo */}
      <aside className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
             style={{ background: 'var(--bar-dark)' }}>

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
             style={{ background: 'var(--bar-gold)' }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-5 bg-white" />

        <div className="relative z-10 flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
               stroke="var(--bar-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
          </svg>
          <span className="text-white tracking-widest text-sm uppercase"
                style={{ letterSpacing: '0.25em' }}>
            Terraza Premium · Bar
          </span>
        </div>

        <div className="relative z-10 text-white">
          <h1 className="font-display text-5xl leading-tight mb-4">
            Cócteles,<br />
            <span style={{ color: 'var(--bar-gold)' }}>buena música y mejor servicio.</span>
          </h1>
          <p className="text-white/60 text-sm max-w-md leading-relaxed">
            Sistema interno del equipo de sala. Toma pedidos, consulta
            disponibilidad y controla las mesas en tiempo real.
          </p>
        </div>

        <div className="relative z-10 text-white/40 text-xs flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--bar-gold)' }} />
          Bar operativo · Sede Galerías
        </div>
      </aside>

      {/* Panel derecho */}
      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="var(--bar-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
            </svg>
            <span className="font-display text-xl" style={{ color: 'var(--bar-dark)' }}>
              Terraza Premium
            </span>
          </div>

          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2"
               style={{ letterSpacing: '0.15em' }}>
              Acceso personal
            </p>
            <h2 className="font-display text-4xl" style={{ color: 'var(--bar-dark)' }}>
              Bienvenida de vuelta
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Ingresa tus credenciales para continuar.
            </p>
          </header>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
                 style={{ background: '#fef2f2', borderColor: '#dc2626', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email"
                     className="block text-xs font-medium uppercase tracking-wider text-gray-600 mb-2"
                     style={{ letterSpacing: '0.1em' }}>
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@terrazapremium.com"
                className="w-full px-4 py-3 rounded-lg border bg-white
                           focus:outline-none focus:ring-2 transition
                           placeholder:text-gray-400"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label htmlFor="password"
                       className="block text-xs font-medium uppercase tracking-wider text-gray-600"
                       style={{ letterSpacing: '0.1em' }}>
                  Contraseña
                </label>
                <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-4 py-3 rounded-lg border bg-white
                           focus:outline-none focus:ring-2 transition
                           placeholder:text-gray-400"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium tracking-wide
                         transition-all duration-200 disabled:opacity-60
                         hover:translate-y-[-1px] active:translate-y-0"
              style={{ background: 'var(--bar-dark)' }}
            >
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <footer className="mt-10 pt-6 border-t flex justify-between items-center text-xs text-gray-400"
                  style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <span>© 2026 Terraza Premium</span>
            <span>Sede Galerías</span>
          </footer>
        </div>
      </main>
    </div>
  );
}