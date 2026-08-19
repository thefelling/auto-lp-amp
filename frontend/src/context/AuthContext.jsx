import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'https://auto-lp-amp-production.up.railway.app';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      const { token, role, username: uname } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username: uname, role }));
      setUser({ username: uname, role });
      toast.success('Login berhasil!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login gagal');
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logout berhasil');
    navigate('/login');
  };

  const isMaster = user?.role === 'master';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isMaster }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);