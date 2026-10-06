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
      localStorage.setItem('token', data.token || 'session-cookie');
      localStorage.setItem('rol', data.rol);
      localStorage.setItem('email', email);
      if (data.sedeId) localStorage.setItem('sedeId', String(data.sedeId));
      if (data.id) localStorage.setItem('usuarioId', String(data.id));

      if (data.rol === 'MESERA' || data.rol === 'MESERO') {
        navigate('/mesera/mesas');
      } else if (data.rol === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.rol === 'CAJERO') {
        navigate('/cajero/dashboard');
      } else {
        localStorage.clear();
        setError('Unknown role: ' + data.rol);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--bar-dark)' }}
      >
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'var(--bar-gold)' }}
        />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-5 bg-white" />

        <div className="relative z-10 flex items-center gap-3">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bar-gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
          </svg>
          <span
            className="text-white tracking-widest text-sm uppercase"
            style={{ letterSpacing: '0.25em' }}
          >
            Terraza Premium · Bar
          </span>
        </div>

        <div className="relative z-10 text-white">
          <h1 className="font-display text-5xl leading-tight mb-4">
            Cocktails,<br />
            <span style={{ color: 'var(--bar-gold)' }}>
              good music and better service.
            </span>
          </h1>
          <p className="text-white/60 text-sm max-w-md leading-relaxed">
            Internal system for the floor team. Take orders, check availability
            and control tables in real time.
          </p>
        </div>

        <div className="relative z-10 text-white/40 text-xs flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--bar-gold)' }}
          />
          Bar active · Galerías branch
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bar-dark)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
            </svg>
            <span
              className="font-display text-xl"
              style={{ color: 'var(--bar-dark)' }}
            >
              Terraza Premium
            </span>
          </div>

          <header className="mb-10">
            <p
              className="text-xs uppercase tracking-widest text-gray-500 mb-2"
              style={{ letterSpacing: '0.15em' }}
            >
              Staff access
            </p>
            <h2
              className="font-display text-4xl"
              style={{ color: 'var(--bar-dark)' }}
            >
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Sign in with your credentials to continue.
            </p>
          </header>

          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
              style={{
                background: '#fef2f2',
                borderColor: '#dc2626',
                color: '#991b1b',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wider text-gray-600 mb-2"
                style={{ letterSpacing: '0.1em' }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@terrazapremium.com"
                className="w-full px-4 py-3 rounded-lg border bg-white
                           focus:outline-none focus:ring-2 transition
                           placeholder:text-gray-400"
                style={{ borderColor: 'rgba(0,0,0,0.15)' }}
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium uppercase tracking-wider text-gray-600"
                  style={{ letterSpacing: '0.1em' }}
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Forgot password?
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
              {loading ? 'Verifying...' : 'Sign in'}
            </button>
          </form>

          <footer
            className="mt-10 pt-6 border-t flex justify-between items-center text-xs text-gray-400"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <span>© 2026 Terraza Premium</span>
            <span>Galerías Branch</span>
          </footer>
        </div>
      </main>
    </div>
  );
}