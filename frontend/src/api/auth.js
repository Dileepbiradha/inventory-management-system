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
  // ✅ Login
  login: ({ email, password }) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    return axios.post(`${API_URL}/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  // ✅ Register (THIS WAS MISSING!)
  register: (userData) => {
    return axios.post(`${API_URL}/auth/register`, userData, {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  // ✅ Get current user
  me: () => apiClient.get('/auth/me'),

  // ✅ Verify email
  verifyEmail: (token) => {
    return axios.get(`${API_URL}/auth/verify-email/${token}`);
  },

  // ✅ Resend verification email
  resendVerification: (email) => {
    return axios.post(`${API_URL}/auth/resend-verification`, { email });
  },

  // ✅ Forgot password
  forgotPassword: (email) => {
    return axios.post(`${API_URL}/auth/forgot-password`, { email });
  },

  // ✅ Reset password
  resetPassword: (token, newPassword) => {
    return axios.post(`${API_URL}/auth/reset-password`, {
      token,
      new_password: newPassword,
    });
  },

  // ✅ Change password (requires login)
  changePassword: (oldPassword, newPassword) => {
    return apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};