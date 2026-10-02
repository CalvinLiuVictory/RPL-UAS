import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 15000,
})

export const resources = {
  complaints: {
    list: params => api.get('/complaints', { params }),
    get: id => api.get(`/complaints/${id}`),
    create: payload => api.post('/complaints', payload),
  },
  buildings: { list: params => api.get('/buildings', { params }) },
  rooms: { list: params => api.get('/rooms', { params }) },
  devices: { list: params => api.get('/devices', { params }) },
  maintenance: { list: params => api.get('/maintenance', { params }) },
}