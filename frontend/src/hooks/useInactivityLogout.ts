import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export function useInactivityLogout(timeoutMs = 180000) {
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const logout = async () => {
      try {
        await api.post('/api/auth/logout');
      } catch {}
      localStorage.clear();
      navigate('/login', { replace: true });
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [navigate, timeoutMs]);
}