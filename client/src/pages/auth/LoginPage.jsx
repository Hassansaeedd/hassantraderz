// client/src/pages/auth/LoginPage.jsx — Professional Secure Glassmorphic Login Portal
import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Segmented, Typography } from 'antd';
import {
  UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone,
  SunOutlined, MoonOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import api from '../../api/axiosInstance';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { mode, toggleTheme } = useThemeStore();
  const isDark = mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loginForm] = Form.useForm();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Login
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        username: values.username?.trim(),
      };
      const res = await api.post('/auth/login', payload);
      const user = res.data.user;
      const token = res.data.accessToken;
      setAuth(user, token);
      message.success(`Welcome, ${user.fullName || user.username}`);

      // Route Super Admin to Super Admin Dashboard
      if (user.username === 'Hassan@009' || user.role === 'SUPERADMIN') {
        navigate('/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    } catch (err) {
      message.error(err?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const switchLang = (lang) => i18n.changeLanguage(lang);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? 12 : 24,
      position: 'relative',
      background: isDark
        ? 'linear-gradient(145deg, #090d16 0%, #111827 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      overflow: 'hidden',
      transition: 'background 0.3s ease',
    }}>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute', top: '-15%', left: '10%', width: 600, height: 600,
        background: isDark ? 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? 440 : 880,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        borderRadius: 20,
        overflow: 'hidden',
        background: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        zIndex: 1,
        minHeight: isMobile ? 'auto' : 480,
      }}>

        {/* LEFT PANEL: Secure Login Form */}
        <div style={{
          flex: 1.15,
          padding: isMobile ? '28px 20px' : '40px 38px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Top Bar: Brand, Theme Switcher & Language */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/logo.png"
                  alt="PrimeCell POS Logo"
                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
                />
                <div>
                  <h1 style={{ fontSize: 17.5, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', margin: 0 }}>
                    PrimeCell POS
                  </h1>
                  <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 11.5 }}>
                    Enterprise POS Suite v2.4
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Button
                  size="small"
                  icon={isDark ? <SunOutlined style={{ color: '#f59e0b' }} /> : <MoonOutlined style={{ color: '#6366f1' }} />}
                  onClick={toggleTheme}
                  style={{ borderRadius: 8 }}
                />
                <Segmented
                  size="small"
                  options={[{ label: 'EN', value: 'en' }, { label: 'اردو', value: 'ur' }]}
                  value={i18n.language}
                  onChange={switchLang}
                />
              </div>
            </div>

            {/* Title & Instructions */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', margin: 0 }}>
                Sign In
              </h2>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                Enter your username and password to access the software
              </p>
            </div>

            {/* Login Form */}
            <Form form={loginForm} layout="vertical" onFinish={handleLogin} size="large">
              <Form.Item name="username" rules={[{ required: true, message: 'Username is required' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ borderRadius: 10, height: 46 }}
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Password"
                  autoComplete="current-password"
                  style={{ borderRadius: 10, height: 46 }}
                  iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined style={{ color: '#94a3b8' }} />}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 48,
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 800,
                  background: '#2563eb',
                  borderColor: '#2563eb',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  marginTop: 6,
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In (لاگ ان)'}
              </Button>
            </Form>
          </div>

          {/* Footer Note */}
          <div style={{ marginTop: 24, paddingTop: 14, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: isDark ? '#64748b' : '#94a3b8' }}>
              PrimeCell POS Commercial Edition
            </span>
            <span style={{ fontSize: 11.5, color: '#10b981', fontWeight: 600 }}>
              ● Secure Platform
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Modern Mobile Shop & Accessories Showcase Image */}
        {!isMobile && (
          <div style={{
            flex: 0.95,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 24,
            backgroundImage: 'url(/login_showcase.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          }}>
            {/* Subtle Gradient Shade for Contrast */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'linear-gradient(180deg, rgba(9, 13, 22, 0.1) 0%, rgba(9, 13, 22, 0.8) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 0.75) 100%)',
              pointerEvents: 'none',
            }} />

            {/* Sleek Bottom Glass Overlay Tag */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '14px 18px',
              color: '#ffffff',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.2, marginBottom: 2 }}>
                Mobile Phones, Accessories & Repair POS
              </div>
              <div style={{ fontSize: 11.5, color: '#cbd5e1', opacity: 0.9 }}>
                PrimeCell POS Enterprise Retail Software
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
