import axios from 'axios';

// Konfigurasi instance Axios terpusat
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor: menyelipkan Authorization Bearer token secara otomatis
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: menangani 401 Unauthorized (token expired/invalid)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Bersihkan session tersimpan jika 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Set pesan sesi berakhir untuk ditampilkan di LoginPage
      sessionStorage.setItem('auth_notice', 'Sesi berakhir, silakan login ulang');

      // Redirect ke login jika pengguna belum di halaman login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
