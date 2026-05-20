import axios from './axios'

export const categoriesAPI = {
  list: () => axios.get('/categories/'),
  create: (data) => axios.post('/categories/', data),
  update: (id, data) => axios.put(`/categories/${id}`, data),
  delete: (id) => axios.delete(`/categories/${id}`),
}