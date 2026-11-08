import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api/client';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const u = await api.getCurrentUser();
      setUser(u);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res?.ok) {
      await refreshUser();
    }
    return res;
  };

  const register = async (username, email, password) => {
    const res = await api.register(username, email, password);
    if (res?.ok) {
      await refreshUser();
    }
    return res;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
