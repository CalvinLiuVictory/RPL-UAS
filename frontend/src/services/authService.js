import api from './api';

export const authService = {
  /**
   * Login ke sistem menggunakan email dan password
   */
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    const { access_token, user } = response.data;

    if (access_token) {
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    return { token: access_token, user };
  },

  /**
   * Logout dan cabut token di server Sanctum
   */
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.warn('Logout request failed or token already invalid:', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Verifikasi token yang ada dengan memanggil GET /api/me
   */
  getMe: async () => {
    const response = await api.get('/me');
    const user = response.data.user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  },

  /**
   * Mengambil sesi user dari penyimpanan lokal
   */
  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Mengambil token autentikasi
   */
  getToken: () => {
    return localStorage.getItem('token');
  },
};

export default authService;
