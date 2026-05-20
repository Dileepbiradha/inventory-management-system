import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance that auto-attaches token
const apiClient = axios.create({
  baseURL: API_URL,
});

// Auto-attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: ({ email, password }) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    return axios.post(`${API_URL}/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  me: () => apiClient.get('/auth/me'),
};