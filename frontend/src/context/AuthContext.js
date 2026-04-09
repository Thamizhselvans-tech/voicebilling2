import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('vb_user');
    const token = localStorage.getItem('vb_token');

    if (stored && token) {
      setUser(JSON.parse(stored));
    }

    setLoading(false);
  }, []);

  // ✅ FIXED LOGIN FUNCTION
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      // 🔥 IMPORTANT CHECK
      if (res.data.success) {
        localStorage.setItem('vb_token', res.data.token);
        localStorage.setItem('vb_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
      } else {
        throw new Error(res.data.message || "Login failed");
      }

    } catch (err) {
      console.log("Login error:", err);
      throw err.response?.data?.message || err.message || "Login failed";
    }
  };

  const logout = () => {
    localStorage.removeItem('vb_token');
    localStorage.removeItem('vb_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);