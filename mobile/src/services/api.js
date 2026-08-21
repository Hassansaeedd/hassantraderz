// mobile/src/services/api.js — Dynamic Mobile Axios API Client with Auto-IP Resolution
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Dynamically resolve your computer's local Wi-Fi IP address from Expo Metro
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3001/api/v1`;
  }
  // Fallback to explicit LAN IP
  return 'http://192.168.100.49:3001/api/v1';
};

export const BASE_URL = getBaseUrl();

console.log('[Mobile API] Connecting to backend at:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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
    const message = error.response?.data?.message || error.message || 'Network connection failed. Make sure your server is running on http://192.168.100.49:3001';
    return Promise.reject(new Error(message));
  }
);

export default api;
