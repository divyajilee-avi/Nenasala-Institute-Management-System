/**
 * Authentication Context — Nenasala IMS
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('nims_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      console.log('AuthContext: Starting login...');
      const res = await authAPI.login({ email, password });
      console.log('AuthContext: Login response:', res.data);
      
      const { token, user } = res.data.data;
      
      if (!token || !user) {
        throw new Error('Invalid response: missing token or user data');
      }
      
      localStorage.setItem('nims_token', token);
      setUser(user);
      console.log('AuthContext: Login successful, user set:', user);
      return user;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
