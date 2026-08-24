// client/src/api/axiosInstance.js — Axios Instance with Token Handling & Dynamic Production URL
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiBaseUrl = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  withCredentials: true,
});

// Request: attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: handle errors globally
api.interceptors.response.use(
  (res) => res.data, // Unwrap data

  async (error) => {
    // If 401 Unauthorized (invalid token / token missing), logout & redirect to login
    if (error.response?.status === 401) {
      const auth = useAuthStore.getState();
      if (auth.user) {
        auth.logout();
        window.location.href = '/login';
      }
    }

    // Network error
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection or server status.',
        code: 'NETWORK_ERROR',
      });
    }

    return Promise.reject(error.response.data || error);
  }
);

export default api;
