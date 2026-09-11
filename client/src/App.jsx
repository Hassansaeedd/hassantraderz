// client/src/App.jsx — Clean Global App Layout
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp } from 'antd';
import AppRouter from './router/AppRouter';
import { useTranslation } from 'react-i18next';
import { syncPendingSales } from './utils/offlineQueue';
import api from './api/axiosInstance';

export default function App() {
  const { i18n } = useTranslation();

  // Apply RTL on mount
  useEffect(() => {
    const lang = i18n.language;
    document.documentElement.dir  = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [i18n.language]);

  // Purge any stale Workbox API cache so mobile devices always get fresh live inventory
  useEffect(() => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key === 'api-cache' || key.includes('api')) {
            caches.delete(key).catch(() => {});
          }
        });
      }).catch(() => {});
    }
  }, []);

  // Sync offline queue when connection restores
  useEffect(() => {
    const handleOnline = async () => {
      try {
        await syncPendingSales((data) => api.post('/sales', data));
      } catch { /* silent */ }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <BrowserRouter>
      <AntApp>
        <AppRouter />
      </AntApp>
    </BrowserRouter>
  );
}
