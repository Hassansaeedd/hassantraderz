// client/src/components/layout/AppLayout.jsx — Professional Header Bar & Theme Navigation
import { useState } from 'react';
import { Layout, Button, Dropdown, Space, Avatar, Drawer } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
  LogoutOutlined, SunOutlined, MoonOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Sidebar from './Sidebar';
import LicenseModal from '../license/LicenseModal';

const { Header, Content } = Layout;

export default function AppLayout() {
  const { t, i18n }  = useTranslation();
  const navigate      = useNavigate();
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();

  const [collapsed, setCollapsed]         = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [licenseOpen, setLicenseOpen]     = useState(false);

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

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar" style={{ display: 'block' }}>
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
        bodyStyle={{ padding: 0, background: 'var(--bg-base)' }}
        width={240}
      >
        <Sidebar collapsed={false} />
      </Drawer>

      <Layout style={{
        marginInlineStart: collapsed ? 80 : 240,
        transition: 'margin-inline-start 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'transparent',
      }}>
        {/* Header Toolbar */}
        <Header style={{
          padding: '0 24px',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          height: 60,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, color: 'var(--text)' }}
            />
          </div>

          <Space size="middle">
            {/* License Status Button */}
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
              }}
            >
              {mode === 'dark' ? 'Light' : 'Dark'}
            </Button>

            {/* Language Switcher */}
            <Button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ur' : 'en')}
              style={{ borderRadius: 8, fontWeight: 600, borderColor: 'var(--border)', background: 'var(--bg-elevated)', color: 'var(--text)' }}
            >
              {i18n.language === 'en' ? 'اردو' : 'English'}
            </Button>

            {/* Staff User Profile Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ background: 'var(--primary)' }} size="small" />
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{user?.fullName}</span>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* Workspace Content Viewport */}
        <Content style={{ padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Software Licensing Modal */}
      <LicenseModal open={licenseOpen} onClose={() => setLicenseOpen(false)} />
    </Layout>
  );
}
