import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cs_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = (token, userData) => {
    localStorage.setItem('cs_token', token);
    localStorage.setItem('cs_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    setUser(null);
    window.location.href = '/login';
  };

  // 30-Minute Idle Timeout
  useEffect(() => {
    if (!user) return;

    let timeout;
    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      // 30 minutes = 1800000ms
      timeout = setTimeout(() => {
        console.warn('Session expired due to inactivity (30m)');
        logout();
      }, 30 * 60 * 1000);
    };

    // Events that reset the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    
    resetTimer(); // Start timer

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [user]);

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      const updated = { ...user, ...data.user };
      localStorage.setItem('cs_user', JSON.stringify(updated));
      setUser(updated);
    } catch { logout(); }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
