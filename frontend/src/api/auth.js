import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Single axios instance with /api baseURL
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
});

// Auto-attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional: auto-logout on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // uncomment if you want hard redirect
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  // ✅ Login (OAuth2 form-encoded)
  login: ({ email, password }) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('grant_type', 'password');

    return apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

  // ✅ Register
  register: (userData) => apiClient.post('/auth/register', userData),

  // ✅ Get current user
  me: () => apiClient.get('/auth/me'),

  // ✅ Verify email
  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),

  // ✅ Resend verification
  resendVerification: (email) =>
    apiClient.post('/auth/resend-verification', { email }),

  // ✅ Forgot password
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),

  // ✅ Reset password
  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    }),

  // ✅ Change password
  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    }),
};

export default apiClient;