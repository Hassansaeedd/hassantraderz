// mobile/src/services/api.js — Mobile Axios API Client
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In development, replace with your local Wi-Fi IP or ngrok tunnel (e.g. http://192.168.1.100:3001/api/v1)
export const BASE_URL = 'http://10.0.2.2:3001/api/v1'; // 10.0.2.2 for Android Emulator, use machine IP for real phone

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject Bearer token
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('mobile_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // ignore
  }
  return config;
});

// Response interceptor: Unwrap res.data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
