// client/src/components/layout/Sidebar.jsx — Sleek Minimal Glassmorphic Sticky Sidebar
import { Layout } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import {
  DashboardOutlined, ShoppingCartOutlined, AppstoreOutlined,
  ShoppingOutlined, TeamOutlined, TruckOutlined,
  BarChartOutlined, SettingOutlined, UserOutlined,
  InboxOutlined, ToolOutlined, SwapOutlined, BookOutlined, AuditOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Sidebar({ collapsed, onNavClick }) {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user }    = useAuthStore();

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

  const handleItemClick = (key) => {
    navigate(key);
    if (onNavClick) onNavClick();
  };

  return (
    <Sider
      collapsed={collapsed}
      width={240}
      collapsedWidth={80}
      className="glass-sidebar"
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Brand Emblem / Official Logo */}
      <div style={{
        padding: collapsed ? '16px 8px' : '18px 16px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="Hassan Traderz Logo"
            style={{
              width: collapsed ? 34 : 38,
              height: collapsed ? 34 : 38,
              borderRadius: 8,
              objectFit: 'cover',
              flexShrink: 0,
              border: '1px solid var(--border)',
            }}
          />
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--text)', lineHeight: 1.2, letterSpacing: -0.2 }}>
                {i18n.language === 'ur' ? 'حسن ٹریڈرز' : 'Hassan Traderz'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
                POS Suite v2.4
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
                padding: '14px 14px 4px', fontSize: 10, fontWeight: 700,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1,
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
              onClick={() => handleItemClick(item.key)}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ fontSize: 17, display: 'flex', alignItems: 'center' }}>
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
