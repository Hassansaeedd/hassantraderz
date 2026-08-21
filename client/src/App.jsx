// client/src/App.jsx — Global App with Interactive Particles Background
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { App as AntApp } from 'antd';
import AppRouter from './router/AppRouter';
import ParticlesBackground from './components/common/ParticlesBackground';
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
        <ParticlesBackground />
        <AppRouter />
      </AntApp>
    </BrowserRouter>
  );
}
