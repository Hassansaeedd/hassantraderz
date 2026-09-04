// client/src/components/layout/AppLayout.jsx — Zero-Gap Responsive Layout with Floating Sidebar
import { useState, useEffect } from 'react';
import { Layout, Button, Dropdown, Space, Avatar, Drawer } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
  LogoutOutlined, SunOutlined, MoonOutlined,
  KeyOutlined, MenuOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Sidebar from './Sidebar';
import LicenseModal from '../license/LicenseModal';

const { Header, Content } = Layout;

export default function AppLayout() {
  const { t, i18n }  = useTranslation();
  const navigate      = useNavigate();
  const location      = useLocation();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();

  const [collapsed, setCollapsed]         = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [licenseOpen, setLicenseOpen]     = useState(false);
  const [isMobile, setIsMobile]           = useState(window.innerWidth <= 992);

  // Monitor window resize dynamically
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileVisible(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{user?.fullName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'license',
      icon: <KeyOutlined style={{ color: 'var(--primary)' }} />,
      label: 'Software License',
      onClick: () => setLicenseOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: t('auth.logout'),
      onClick: handleLogout,
    },
  ];

  const handleToggleNav = () => {
    if (isMobile) {
      setMobileVisible(!mobileVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-base)', width: '100%' }}>
      {/* Desktop Floating Sidebar (Fixed left: 0) */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} />
      )}

      {/* Mobile / Tablet Drawer Sidebar (<= 992px) */}
      <Drawer
        placement="left"
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
        bodyStyle={{ padding: 0, background: 'var(--sidebar-bg)' }}
        width={260}
        closable={false}
      >
        <Sidebar collapsed={false} isDrawer={true} onNavClick={() => setMobileVisible(false)} />
      </Drawer>

      {/* Main Workspace Layout (Offset by sidebar width on desktop) */}
      <Layout
        className="main-layout-container"
        style={{
          marginInlineStart: isMobile ? 0 : (collapsed ? 80 : 240),
          transition: 'margin-inline-start 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'transparent',
          minWidth: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Responsive Header Bar */}
        <Header
          className="app-header"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 60,
            padding: isMobile ? '0 12px' : '0 24px',
          }}
        >
          {/* Left: Navigation Toggle Button & Brand title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              type="text"
              icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={handleToggleNav}
              style={{ fontSize: 18, color: 'var(--text)', padding: '4px 8px' }}
            />

            {isMobile && (
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', letterSpacing: -0.2 }}>
                Hassan Traderz
              </span>
            )}
          </div>

          {/* Right: Quick Actions & Profile */}
          <Space size={isMobile ? 6 : 'middle'}>
            {/* License Status Button (Desktop Only) */}
            {!isMobile && (
              <Button
                icon={<KeyOutlined style={{ color: 'var(--primary)' }} />}
                onClick={() => setLicenseOpen(true)}
                style={{
                  borderRadius: 8,
                  borderColor: 'var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 12.5,
                }}
              >
                License Active
              </Button>
            )}

            {/* Light / Dark Mode Toggle Button */}
            <Button
              icon={mode === 'dark' ? <SunOutlined style={{ color: '#f59e0b' }} /> : <MoonOutlined style={{ color: '#6366f1' }} />}
              onClick={toggleTheme}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                borderColor: 'var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                padding: isMobile ? '4px 10px' : undefined,
              }}
            >
              <span className="header-btn-text">{mode === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>

            {/* Language Switcher */}
            <Button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ur' : 'en')}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                borderColor: 'var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                padding: isMobile ? '4px 10px' : undefined,
              }}
            >
              {i18n.language === 'en' ? 'اردو' : 'EN'}
            </Button>

            {/* Staff User Profile Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ background: 'var(--primary)' }} size="small" />
                {!isMobile && (
                  <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{user?.fullName}</span>
                )}
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Responsive Workspace Content Viewport */}
        <Content className="app-content-viewport" style={{ minHeight: 280, padding: isMobile ? 12 : 24, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Software Licensing Modal */}
      <LicenseModal open={licenseOpen} onClose={() => setLicenseOpen(false)} />
    </Layout>
  );
}
