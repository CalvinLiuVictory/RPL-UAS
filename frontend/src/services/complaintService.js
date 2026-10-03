import api from './api';

export const complaintService = {
  /**
   * Mengambil seluruh daftar pengaduan (GET /pengaduan)
   * Backend memfilter otomatis berdasarkan role pengguna (Admin: semua, Teknisi: tugasnya, User: miliknya)
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
   * teknisiId: ID user dengan role 'teknisi'
   */
  assignTechnician: async (id, teknisiId) => {
    const response = await api.put(`/pengaduan/${id}/assign`, {
      teknisi_id: teknisiId,
    });
    return response.data;
  },

  /**
   * Memperbarui status akhir pengaduan (PUT /pengaduan/{id}/status)
   * status: 'Menunggu' | 'Diproses' | 'Selesai'
   */
  updateStatus: async (id, status, notes) => {
    const payload = { status };
    if (notes) {
      payload.catatan_teknisi = notes;
    }
    const response = await api.put(`/pengaduan/${id}/status`, payload);
    return response.data;
  },
};

export const { getComplaints, createComplaint, assignTechnician, updateStatus } = complaintService;
export default complaintService;
