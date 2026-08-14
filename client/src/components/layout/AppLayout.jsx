// client/src/components/layout/AppLayout.jsx — Header Bar with Theme Toggle & Software Licensing Button
import { useState } from 'react';
import { Layout, Button, Dropdown, Space, Avatar, Tag, Drawer } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined,
  LogoutOutlined, SunOutlined, MoonOutlined, SafetyCertificateOutlined,
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
        <div>
          <div style={{ fontWeight: 700 }}>{user?.fullName}</div>
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
      {/* Desktop Glass Sidebar */}
      <div className="desktop-sidebar" style={{ display: 'block' }}>
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
        bodyStyle={{ padding: 0, background: 'rgba(15, 23, 42, 0.95)' }}
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
          height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: 'var(--text)' }}
            />
          </div>

          <Space size="middle">
            {/* License Status Pill Button */}
            <Button
              icon={<KeyOutlined style={{ color: 'var(--primary)' }} />}
              onClick={() => setLicenseOpen(true)}
              style={{
                borderRadius: 20,
                borderColor: 'rgba(16, 185, 129, 0.4)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              Enterprise License
            </Button>

            {/* Light / Dark Mode Toggle Button */}
            <Button
              icon={mode === 'dark' ? <SunOutlined style={{ color: '#f59e0b' }} /> : <MoonOutlined style={{ color: '#8b5cf6' }} />}
              onClick={toggleTheme}
              style={{
                borderRadius: 20,
                fontWeight: 700,
                borderColor: 'var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
              }}
            >
              {mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </Button>

            {/* Language Switcher */}
            <Button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'ur' : 'en')}
              style={{ borderRadius: 20, fontWeight: 700 }}
            >
              {i18n.language === 'en' ? 'اردو' : 'English'}
            </Button>

            {/* Staff User Profile Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ background: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{user?.fullName}</span>
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
