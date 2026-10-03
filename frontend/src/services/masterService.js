import api from './api';

export const masterService = {
  // --- USERS CRUD ---
  getUsers: async (params) => {
    const response = await api.get('/users', { params });
    // Jika response paginated dari Laravel (data.data), ambil array data-nya
    return response.data?.data ? response.data.data : response.data;
  },
  createUser: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // --- BUILDINGS / GEDUNGS CRUD ---
  getBuildings: async () => {
    const response = await api.get('/gedungs');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },
  createBuilding: async (data) => {
    const response = await api.post('/gedungs', data);
    return response.data;
  },
  updateBuilding: async (id, data) => {
    const response = await api.put(`/gedungs/${id}`, data);
    return response.data;
  },
  deleteBuilding: async (id) => {
    const response = await api.delete(`/gedungs/${id}`);
    return response.data;
  },

  // --- ROOMS / RUANGANS CRUD ---
  getRooms: async () => {
    const response = await api.get('/ruangans');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },
  createRoom: async (data) => {
    const response = await api.post('/ruangans', data);
    return response.data;
  },
  updateRoom: async (id, data) => {
    const response = await api.put(`/ruangans/${id}`, data);
    return response.data;
  },
  deleteRoom: async (id) => {
    const response = await api.delete(`/ruangans/${id}`);
    return response.data;
  },

  // --- DEVICES / PERANGKATS CRUD ---
  getDevices: async () => {
    const response = await api.get('/perangkats');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },
  createDevice: async (data) => {
    const response = await api.post('/perangkats', data);
    return response.data;
  },
  updateDevice: async (id, data) => {
    const response = await api.put(`/perangkats/${id}`, data);
    return response.data;
  },
  deleteDevice: async (id) => {
    const response = await api.delete(`/perangkats/${id}`);
    return response.data;
  },
};

export default masterService;
