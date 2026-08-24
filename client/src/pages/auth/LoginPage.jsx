// client/src/pages/auth/LoginPage.jsx — Dynamic Light/Dark Minimalist Glassmorphic Login Portal
import { useState } from 'react';
import { Form, Input, Button, message, Segmented } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import api from '../../api/axiosInstance';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { mode, toggleTheme } = useThemeStore();
  const isDark = mode === 'dark';
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      setAuth(res.data.user, res.data.accessToken);
      message.success(`Welcome back, ${res.data.user.fullName}!`);
      navigate('/dashboard');
    } catch (err) {
      message.error(err?.message || t('auth.invalidCreds'));
    } finally {
      setLoading(false);
    }
  };

  const switchLang = (lang) => i18n.changeLanguage(lang);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      background: isDark
        ? 'linear-gradient(145deg, #090d16 0%, #111827 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      overflow: 'hidden',
      transition: 'background 0.3s ease',
    }}>
      {/* Subtle Ambient Radial Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '10%',
        width: 600,
        height: 600,
        background: isDark
          ? 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(37, 99, 235, 0.07) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '10%',
        width: 600,
        height: 600,
        background: isDark
          ? 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      {/* Main Glassmorphic Split Container */}
      <div style={{
        width: '100%',
        maxWidth: 920,
        display: 'flex',
        borderRadius: 20,
        overflow: 'hidden',
        background: isDark ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: isDark
          ? '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1)'
          : '0 25px 60px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(37, 99, 235, 0.04)',
        position: 'relative',
        zIndex: 1,
        minHeight: 480,
        transition: 'all 0.3s ease',
      }}>

        {/* LEFT PANEL: Clean Minimalist Login Form */}
        <div style={{
          flex: 1.1,
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Top Bar: Brand, Theme Switcher & Language */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src="/logo.png"
                  alt="Hassan Traderz Logo"
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    objectFit: 'cover',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                />
                <div>
                  <h1 style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: isDark ? '#f8fafc' : '#0f172a',
                    margin: 0,
                    letterSpacing: -0.2,
                  }}>
                    Hassan Traderz
                  </h1>
                  <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }}>
                    Enterprise POS & Inventory
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Button
                  size="small"
                  icon={isDark ? <SunOutlined style={{ color: '#f59e0b' }} /> : <MoonOutlined style={{ color: '#6366f1' }} />}
                  onClick={toggleTheme}
                  style={{
                    borderRadius: 8,
                    background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Segmented
                  size="small"
                  options={[{ label: 'EN', value: 'en' }, { label: 'اردو', value: 'ur' }]}
                  value={i18n.language}
                  onChange={switchLang}
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    fontSize: 12,
                  }}
                />
              </div>
            </div>

            {/* Form Title */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: isDark ? '#f8fafc' : '#0f172a',
                margin: 0,
              }}>
                Sign In
              </h2>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                Enter your credentials to access the POS counter
              </p>
            </div>

            {/* Clean Form Controls */}
            <Form layout="vertical" onFinish={onFinish} size="large">
              <Form.Item name="username" rules={[{ required: true, message: 'Username is required' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: isDark ? '#64748b' : '#94a3b8' }} />}
                  placeholder={t('auth.username')}
                  autoComplete="username"
                  style={{
                    borderRadius: 10,
                    background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    height: 46,
                  }}
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: isDark ? '#64748b' : '#94a3b8' }} />}
                  placeholder={t('auth.password')}
                  autoComplete="current-password"
                  style={{
                    borderRadius: 10,
                    background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    height: 46,
                  }}
                  iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined style={{ color: '#94a3b8' }} />}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{
                    height: 46,
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    background: '#2563eb',
                    borderColor: '#2563eb',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {loading ? t('auth.loggingIn') : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* Minimal Clean Footer */}
          <div style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11.5, color: isDark ? '#64748b' : '#94a3b8' }}>
              v2.4 Commercial Edition
            </span>
            <span style={{ fontSize: 11.5, color: isDark ? '#64748b' : '#94a3b8' }}>
              © {new Date().getFullYear()} Hassan Traderz
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Tech Artwork Showcase */}
        <div style={{
          flex: 0.95,
          position: 'relative',
          overflow: 'hidden',
          borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          background: isDark ? '#090d16' : '#0f172a',
          display: 'flex',
        }}>
          <img
            src="/login_gadgets.jpg"
            alt="Mobile POS System"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDark ? 0.85 : 0.9 }}
          />

          {/* Subtle Dark Vignette & Caption */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(11, 15, 25, 0.1) 0%, rgba(11, 15, 25, 0.85) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 32,
          }}>
            <h3 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.3 }}>
              Mobile Shop Management Suite
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
              POS Billing • Inventory Control • Repair Work Orders • Khata Ledger
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
