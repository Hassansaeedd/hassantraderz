// client/src/main.jsx — Dynamic Professional Theme ConfigProvider
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
      colorPrimary:        '#2563eb',
      colorBgBase:         isDark ? '#090d16' : '#f8fafc',
      colorBgContainer:    isDark ? 'rgba(17, 24, 39, 0.85)' : '#ffffff',
      colorBgElevated:     isDark ? '#1e293b' : '#ffffff',
      colorBorder:         isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      colorBorderSecondary:isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
      colorText:           isDark ? '#f8fafc' : '#0f172a',
      colorTextSecondary:  isDark ? '#cbd5e1' : '#475569',
      colorTextTertiary:   isDark ? '#94a3b8' : '#64748b',
      colorSuccess:        '#10b981',
      colorWarning:        '#f59e0b',
      colorError:          '#ef4444',
      colorInfo:           '#0284c7',
      borderRadius:        8,
      fontFamily:          "'Plus Jakarta Sans', -apple-system, sans-serif",
      fontSize:            14,
      controlHeight:       38,
      boxShadow:           isDark ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 14px rgba(0, 0, 0, 0.05)',
    },
    components: {
      Layout: {
        bodyBg: 'transparent',
        siderBg: isDark ? '#0f172a' : '#ffffff',
        headerBg: isDark ? '#0f172a' : '#ffffff',
      },
      Table: {
        headerBg: isDark ? '#1e293b' : '#f1f5f9',
        rowHoverBg: isDark ? '#1e293b' : '#f8fafc',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        colorText: isDark ? '#f8fafc' : '#0f172a',
        colorTextHeading: isDark ? '#cbd5e1' : '#475569',
      },
      Card: {
        colorBgContainer: isDark ? 'rgba(17, 24, 39, 0.85)' : '#ffffff',
        colorBorderSecondary: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      },
      Input: {
        colorBgContainer: isDark ? '#1e293b' : '#ffffff',
        colorBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        activeBorderColor: '#2563eb',
        colorText: isDark ? '#f8fafc' : '#0f172a',
        colorTextPlaceholder: isDark ? '#64748b' : '#94a3b8',
      },
      Select: {
        colorBgContainer: isDark ? '#1e293b' : '#ffffff',
        colorBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        colorText: isDark ? '#f8fafc' : '#0f172a',
      },
      Button: {
        colorPrimary: '#2563eb',
        controlHeight: 38,
        borderRadius: 8,
      },
      Modal: {
        contentBg: isDark ? '#111827' : '#ffffff',
        headerBg: 'transparent',
      },
      Tag: {
        borderRadiusSM: 4,
      },
      Segmented: {
        trackBg: isDark ? '#1e293b' : '#f1f5f9',
        itemSelectedBg: isDark ? '#2563eb' : '#ffffff',
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
