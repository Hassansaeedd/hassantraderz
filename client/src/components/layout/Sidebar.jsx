// client/src/components/layout/Sidebar.jsx — Unique Glassmorphic Minimal Sidebar with Official Logo
import { Layout } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import {
  DashboardOutlined, ShoppingCartOutlined, AppstoreOutlined,
  ShoppingOutlined, TeamOutlined, TruckOutlined,
  BarChartOutlined, SettingOutlined, UserOutlined,
  InboxOutlined, ToolOutlined, SwapOutlined, BookOutlined, AuditOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Sidebar({ collapsed }) {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user }    = useAuthStore();
  const { mode }    = useThemeStore();

  const isAdmin   = user?.role === 'ADMIN';
  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: '/pos',       icon: <ShoppingCartOutlined />, label: t('nav.pos'), highlight: true },
    { type: 'divider',   label: 'Core Operations' },
    { key: '/repairs',   icon: <ToolOutlined />,      label: 'Mobile Repairs' },
    { key: '/trade-in',  icon: <SwapOutlined />,      label: 'Used Buyback' },
    { key: '/khata',     icon: <BookOutlined />,      label: 'Customer Khata' },
    { key: '/expenses',  icon: <AuditOutlined />,     label: 'Shop Expenses' },
    { key: '/products',  icon: <AppstoreOutlined />,  label: t('nav.products') },
    { key: '/sales',     icon: <ShoppingOutlined />,  label: t('nav.sales') },
    { key: '/purchases', icon: <InboxOutlined />,     label: t('nav.purchases') },
    { type: 'divider',   label: 'Directory' },
    { key: '/customers', icon: <TeamOutlined />,      label: t('nav.customers') },
    { key: '/suppliers', icon: <TruckOutlined />,      label: t('nav.suppliers') },
    { type: 'divider',   label: 'Management', hidden: !isManager },
    { key: '/reports',   icon: <BarChartOutlined />,  label: t('nav.reports'),  hidden: !isManager },
    { key: '/users',     icon: <UserOutlined />,      label: t('nav.users'),    hidden: !isAdmin },
    { key: '/settings',  icon: <SettingOutlined />,   label: t('nav.settings'), hidden: !isAdmin },
  ].filter(item => !item.hidden);

  const activeKey = '/' + location.pathname.split('/')[1];

  return (
    <Sider
      collapsed={collapsed}
      width={240}
      className="glass-sidebar"
      style={{
        position: 'fixed',
        height: '100vh',
        overflow: 'auto',
        insetInlineStart: 0,
        top: 0, bottom: 0,
        zIndex: 200,
      }}
    >
      {/* Brand Emblem / Official Logo */}
      <div style={{
        padding: collapsed ? '16px 8px' : '20px 16px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="Hassan Traderz Logo"
            style={{
              width: collapsed ? 36 : 42,
              height: collapsed ? 36 : 42,
              borderRadius: 12,
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          />
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.2, letterSpacing: 0.5 }}>
                {i18n.language === 'ur' ? 'حسن ٹریڈرز' : 'Hassan Traderz'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>
                Industrial POS v2.4
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <div style={{ paddingBottom: 24 }}>
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') {
            if (collapsed) return null;
            return (
              <div key={idx} style={{
                padding: '16px 16px 6px', fontSize: 10, fontWeight: 700,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2,
              }}>
                {item.label}
              </div>
            );
          }

          const isActive = activeKey === item.key;

          return (
            <div
              key={item.key}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.key)}
              title={collapsed ? item.label : undefined}
              style={item.highlight && !isActive ? {
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: 'var(--primary)',
              } : undefined}
            >
              <span style={{ fontSize: 18, display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Sider>
  );
}
