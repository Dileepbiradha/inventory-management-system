import axios from './axios'

export const productsAPI = {
  list:   (params) => axios.get('/products', { params }),
  get:    (id) => axios.get(`/products/${id}`),
  create: (data) => axios.post('/products', data),
  update: (id, data) => axios.put(`/products/${id}`, data),
  delete: (id) => axios.delete(`/products/${id}`),
  remove: (id) => axios.delete(`/products/${id}`),  // ✅ ADD THIS
}