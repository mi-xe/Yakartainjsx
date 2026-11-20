import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext({ user: null, loading: true, login: async () => {}, logout: async () => {}, refreshUser: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const result = await api.me();
      setUser(result.user || null);
      return result.user || null;
    } catch (error) {
      if (error.status === 401) setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.me()
      .then((result) => { if (active) setUser(result.user || null); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await api.login(credentials);
    setUser(result.user || null);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, setUser, loading, login, logout, refreshUser }), [user, loading, login, logout, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
