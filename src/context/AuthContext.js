import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api/client';

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  verifyAdmin2FA: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => {},
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
    // If login is normal user success
    if (res?.ok && !res?.data?.requires_2fa) {
      await refreshUser();
    }
    return res;
  };

  const verifyAdmin2FA = async (tempToken, code) => {
    const res = await api.adminVerify2fa(tempToken, code);
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

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    if (res?.ok) {
      await refreshUser();
    }
    return res;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const isAdmin = Boolean(
    user &&
    (user.is_admin === true || user.is_owner === true || user.role === 'owner') &&
    (
      user.username?.toLowerCase() === 'fors' ||
      user.email?.toLowerCase() === 'winpubgm8@gmail.com' ||
      String(user.db_id) === '1' ||
      String(user.id) === '6602106053'
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        login,
        verifyAdmin2FA,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
