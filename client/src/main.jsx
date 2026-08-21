// client/src/main.jsx — Dynamic OriginKit Light/Dark Theme ConfigProvider
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
      colorBgBase:         isDark ? '#060913' : '#f1f5f9',
      colorBgContainer:    isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.88)',
      colorBgElevated:     isDark ? 'rgba(24, 33, 56, 0.95)' : 'rgba(255, 255, 255, 0.98)',
      colorBorder:         isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      colorBorderSecondary:isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      colorText:           isDark ? '#f8fafc' : '#0f172a',
      colorTextSecondary:  isDark ? '#cbd5e1' : '#475569',
      colorTextTertiary:   isDark ? '#94a3b8' : '#64748b',
      colorSuccess:        isDark ? '#10b981' : '#059669',
      colorWarning:        isDark ? '#f59e0b' : '#d97706',
      colorError:          isDark ? '#ef4444' : '#dc2626',
      colorInfo:           isDark ? '#06b6d4' : '#0284c7',
      borderRadius:        10,
      fontFamily:          "'Plus Jakarta Sans', -apple-system, sans-serif",
      fontSize:            14,
      controlHeight:       40,
      boxShadow:           isDark ? '0 12px 32px rgba(0, 0, 0, 0.45)' : '0 10px 28px rgba(15, 23, 42, 0.07)',
    },
    components: {
      Layout: {
        bodyBg: 'transparent',
        siderBg: isDark ? 'rgba(10, 15, 29, 0.82)' : 'rgba(255, 255, 255, 0.92)',
        headerBg: isDark ? 'rgba(10, 15, 29, 0.85)' : 'rgba(255, 255, 255, 0.9)',
      },
      Table: {
        headerBg: isDark ? 'rgba(24, 33, 56, 0.8)' : '#f8fafc',
        rowHoverBg: isDark ? 'rgba(30, 41, 68, 0.6)' : 'rgba(241, 245, 249, 0.8)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        colorText: isDark ? '#f8fafc' : '#0f172a',
        colorTextHeading: isDark ? '#cbd5e1' : '#475569',
      },
      Card: {
        colorBgContainer: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.88)',
        colorBorderSecondary: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      },
      Input: {
        colorBgContainer: isDark ? 'rgba(20, 28, 48, 0.75)' : '#ffffff',
        colorBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)',
        activeBorderColor: isDark ? '#10b981' : '#059669',
        colorText: isDark ? '#f8fafc' : '#0f172a',
        colorTextPlaceholder: isDark ? '#64748b' : '#94a3b8',
      },
      Select: {
        colorBgContainer: isDark ? 'rgba(20, 28, 48, 0.75)' : '#ffffff',
        colorBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)',
        colorText: isDark ? '#f8fafc' : '#0f172a',
      },
      Button: {
        colorPrimary: isDark ? '#10b981' : '#059669',
        controlHeight: 40,
        borderRadius: 8,
      },
      Modal: {
        contentBg: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
        headerBg: 'transparent',
      },
      Tag: {
        borderRadiusSM: 6,
      },
      Segmented: {
        trackBg: isDark ? 'rgba(20, 28, 48, 0.8)' : 'rgba(241, 245, 249, 0.9)',
        itemSelectedBg: isDark ? '#10b981' : '#ffffff',
        itemSelectedColor: isDark ? '#ffffff' : '#0f172a',
      },
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
