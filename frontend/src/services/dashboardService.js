import api from './api';

export const dashboardService = {
  /**
   * Mengambil data statistik agregat dashboard sesuai role pengguna aktif
   */
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default dashboardService;
