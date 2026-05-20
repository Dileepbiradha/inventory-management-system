import api from './axios'

export const dashboardAPI = {
  getStats: async () => {
    const { data } = await api.get('/dashboard/stats')         // ✅
    return data
  },
  getLowStock: async () => {
    const { data } = await api.get('/dashboard/low-stock')     // ✅
    return data
  },
  getRecentTransactions: async () => {
    const { data } = await api.get('/dashboard/recent-transactions')  // ✅
    return data
  },
}