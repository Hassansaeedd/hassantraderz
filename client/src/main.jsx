// client/src/main.jsx — Dynamic Light/Dark Theme ConfigProvider
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme as antdTheme } from 'antd';
import './i18n/index.js';
import App from './App.jsx';
import { useThemeStore } from './store/themeStore.js';
import './styles/global.css';

function Main() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const isDark = mode === 'dark';

  const themeConfig = {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary:        isDark ? '#10b981' : '#059669',
      colorBgBase:         isDark ? '#090d16' : '#f8fafc',
      colorBgContainer:    isDark ? '#111827' : '#ffffff',
      colorBgElevated:     isDark ? '#1f293d' : '#ffffff',
      colorBorder:         isDark ? '#1e293b' : '#e2e8f0',
      colorText:           isDark ? '#f1f5f9' : '#0f172a',
      colorTextSecondary:  isDark ? '#94a3b8' : '#64748b',
      colorSuccess:        '#10b981',
      colorWarning:        '#f59e0b',
      colorError:          '#ef4444',
      colorInfo:           isDark ? '#06b6d4' : '#0284c7',
      borderRadius:        10,
      fontFamily:          "'Inter', -apple-system, sans-serif",
      fontSize:            14,
      controlHeight:       40,
    },
    components: {
      Layout:  { bodyBg: 'transparent', siderBg: isDark ? '#0f172a' : '#ffffff', headerBg: isDark ? '#0f172a' : '#ffffff' },
      Menu:    { darkItemBg: '#0f172a', darkItemSelectedBg: '#10b981', darkItemHoverBg: '#1e293b' },
      Table:   { headerBg: isDark ? '#1e293b' : '#f1f5f9', rowHoverBg: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
      Card:    { colorBgContainer: isDark ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.95)', colorBorderSecondary: isDark ? '#1e293b' : '#e2e8f0' },
      Input:   { colorBgContainer: isDark ? '#1f293d' : '#ffffff', colorBorder: isDark ? '#334155' : '#cbd5e1', activeBorderColor: '#10b981' },
      Select:  { colorBgContainer: isDark ? '#1f293d' : '#ffffff', colorBorder: isDark ? '#334155' : '#cbd5e1' },
      Button:  { colorPrimary: isDark ? '#10b981' : '#059669' },
      Modal:   { contentBg: isDark ? '#111827' : '#ffffff', headerBg: isDark ? '#111827' : '#ffffff', footerBg: isDark ? '#111827' : '#ffffff' },
    },
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
