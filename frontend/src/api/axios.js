import axios from "axios";

// Get base URL and ensure it ends with /api
const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:8000";
  // Remove trailing slash, then add /api
  return url.replace(/\/$/, "").replace(/\/api$/, "") + "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;