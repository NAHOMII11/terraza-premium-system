import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import barHero from '../assets/bar-hero.png';
import './Login.css';

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="login-brand" style={compact ? { flexDirection: 'column', gap: '0.45rem' } : undefined}>
      <svg width={compact ? 34 : 28} height={compact ? 34 : 28} viewBox="0 0 24 24" fill="none"
           stroke="#926208" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3h8l-4 8v10" />
        <path d="M9.5 21h5" />
        <path d="M4 3c2.4 2.2 4 4.8 4 8" />
        <path d="M20 3c-2.4 2.2-4 4.8-4 8" />
      </svg>
      <div style={compact ? { textAlign: 'center' } : undefined}>
        <p className="login-brand-name">Terraza</p>
        <p className="login-brand-sub">Premium</p>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();

  const emailInvalid = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordInvalid = touched.password && password.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError('');
    setInfo('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      setError('Check your email and password to continue.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token || 'session-cookie');
      localStorage.setItem('rol', data.rol);
      localStorage.setItem('email', email);
      if (data.sedeId) localStorage.setItem('sedeId', String(data.sedeId));
      if (data.sede) localStorage.setItem('sedeNombre', data.sede);
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
      setError(err.response ? 'Invalid credentials' : 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-hero">
        <img src={barHero} alt="Terraza Premium bar" />
        <div className="login-hero-shade" />
        <div className="login-hero-content">
          <BrandMark />
          <div>
            <p className="login-kicker">Cocktails · Experiences · Exclusive nights</p>
            <h1 className="login-serif login-headline">A night beyond the ordinary.</h1>
            <p className="login-subhead">A space to enjoy every detail.</p>
            <p className="login-caption">Discover the space</p>
          </div>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-panel-inner">
          <div className="login-panel-brand">
            <BrandMark compact />
          </div>
          <div className="login-rule" />
          <h2 className="login-serif login-title">Welcome back</h2>
          <p className="login-lead">Exclusive access for the team</p>

          {error && <div className="login-alert login-alert-error" role="alert">{error}</div>}
          {info && <div className="login-alert login-alert-info" role="status">{info}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1.15rem' }}>
              <label htmlFor="email" className="login-label">Email address</label>
              <div className="login-field">
                <svg className="lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 7 9-7" />
                </svg>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="you@email.com"
                  aria-invalid={emailInvalid}
                  className={`login-input${emailInvalid ? ' is-invalid' : ''}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="login-label">Password</label>
              <div className="login-field">
                <svg className="lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="Enter your password"
                  aria-invalid={passwordInvalid}
                  className={`login-input${passwordInvalid ? ' is-invalid' : ''}`}
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.6 1.4-1.5 2.7-2.6 3.8" />
                      <path d="M6.1 6.1C4.2 7.4 2.8 9.1 2 12c1.7 3.9 6 7 10 7 1.3 0 2.5-.2 3.6-.7" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="login-forgot"
                  onClick={() => {
                    setError('');
                    setInfo('Ask the administrator to reset your password from the Admin panel.');
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? <span className="login-spinner" aria-hidden="true" /> : null}
              {loading ? 'Verifying…' : 'Sign in'}
              {!loading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              ) : null}
            </button>
          </form>

          <p className="login-secure">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Secure access · Authorized staff only
          </p>
          <p className="login-foot">© {new Date().getFullYear()} Terraza Premium · Staff portal</p>
        </div>
      </main>
    </div>
  );
}
