import axios from './axios'

export const movementsAPI = {
  list: (params) => axios.get('/movements', { params }),
  count: (params) => axios.get('/movements/count', { params }),
  get: (id) => axios.get(`/movements/${id}`),
  create: (data) => axios.post('/movements', data),
  productHistory: (productId, params) =>
    axios.get(`/movements/product/${productId}/history`, { params }),
}