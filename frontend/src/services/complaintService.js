import api from './api';

export const complaintService = {
  /**
   * Mengambil seluruh daftar pengaduan (GET /pengaduan)
   * Disaring otomatis oleh backend berdasarkan role (Admin: semua, Teknisi: miliknya, User: miliknya)
   */
  getComplaints: async (params) => {
    const response = await api.get('/pengaduan', { params });
    return response.data;
  },

  /**
   * Membuat pengaduan baru (POST /pengaduan)
   * data: { perangkat_id, deskripsi }
   */
  createComplaint: async (data) => {
    const response = await api.post('/pengaduan', data);
    return response.data;
  },

  /**
   * Menugaskan teknisi pada pengaduan (PUT /pengaduan/{id}/assign)
   */
  assignTechnician: async (id, teknisiId) => {
    const response = await api.put(`/pengaduan/${id}/assign`, {
      teknisi_id: teknisiId,
    });
    return response.data;
  },

  /**
   * Memperbarui status akhir pengaduan (PUT /pengaduan/{id}/status)
   */
  updateStatus: async (id, status, notes) => {
    const payload = { status };
    if (notes) {
      payload.catatan_teknisi = notes;
    }
    const response = await api.put(`/pengaduan/${id}/status`, payload);
    return response.data;
  },

  /**
   * Catat hasil pemeriksaan teknisi (PUT /pengaduan/{id}/periksa)
   */
  pemeriksaan: async (id, catatan) => {
    const response = await api.put(`/pengaduan/${id}/periksa`, { catatan_teknisi: catatan });
    return response.data;
  },

  /**
   * Catat tindakan perbaikan teknisi (PUT /pengaduan/{id}/perbaiki)
   */
  catatPerbaikan: async (id, catatan) => {
    const response = await api.put(`/pengaduan/${id}/perbaiki`, { catatan_teknisi: catatan });
    return response.data;
  },

  /**
   * Mengambil daftar jadwal maintenance (GET /maintenance)
   */
  getMaintenances: async () => {
    const response = await api.get('/maintenance');
    return response.data;
  },

  /**
   * Membuat jadwal maintenance baru (POST /maintenance)
   */
  createMaintenance: async (data) => {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  /**
   * Catat hasil pelaksanaan maintenance (PUT /maintenance/{id}/catat)
   */
  catatMaintenance: async (id, data) => {
    const response = await api.put(`/maintenance/${id}/catat`, data);
    return response.data;
  },

  /**
   * Mengambil daftar perangkat aktif untuk dropdown form komplain
   */
  getDevices: async () => {
    const response = await api.get('/perangkats');
    return response.data;
  },
};

export const {
  getComplaints,
  createComplaint,
  assignTechnician,
  updateStatus,
  pemeriksaan,
  catatPerbaikan,
  getMaintenances,
  createMaintenance,
  catatMaintenance,
  getDevices,
} = complaintService;
export default complaintService;
