// mobile/src/store/authStore.js — Mobile Auth State with AsyncStorage
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  initialize: async () => {
    try {
      const savedUser = await AsyncStorage.getItem('mobile_user');
      const savedToken = await AsyncStorage.getItem('mobile_access_token');
      if (savedUser && savedToken) {
        set({ user: JSON.parse(savedUser), token: savedToken, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const user = res.data.user;
    const token = res.data.accessToken;

    await AsyncStorage.setItem('mobile_user', JSON.stringify(user));
    await AsyncStorage.setItem('mobile_access_token', token);

    set({ user, token });
    return user;
  },

  logout: async () => {
    await AsyncStorage.removeItem('mobile_user');
    await AsyncStorage.removeItem('mobile_access_token');
    set({ user: null, token: null });
  },
}));
