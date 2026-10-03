import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // 1. Pengecekan sesi awal: jika token ada, panggil GET /api/me untuk validasi user aktif
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/me');
        const currentUser = response.data.user;
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Session verification failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // 2. Method login(email, password): POST ke /api/login, simpan token & user di localStorage
  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user: loggedInUser } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      setToken(access_token);
      setUser(loggedInUser);

      return { success: true, user: loggedInUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal, periksa email dan password.';
      return { success: false, message, error };
    }
  };

  // 3. Method logout(): POST ke /api/logout, hapus data di localStorage
  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.warn('Logout API request error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook helper untuk mempermudah penggunaan di komponen lain
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
