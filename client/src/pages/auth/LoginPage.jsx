// client/src/pages/auth/LoginPage.jsx — Premium Minimalist Glassmorphic Login Portal
import { useState } from 'react';
import { Form, Input, Button, message, Segmented } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
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
      background: 'linear-gradient(145deg, #0b0f19 0%, #111827 50%, #0f172a 100%)',
      overflow: 'hidden',
    }}>
      {/* Subtle Ambient Background Gradients */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '10%',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '10%',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)',
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
        background: 'rgba(17, 24, 39, 0.75)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1,
        minHeight: 480,
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
            {/* Top Bar: Brand & Language Switcher */}
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
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                  }}
                />
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: -0.2 }}>
                    Hassan Traderz
                  </h1>
                  <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>
                    Enterprise POS & Inventory
                  </span>
                </div>
              </div>

              <Segmented
                options={[{ label: 'EN', value: 'en' }, { label: 'اردو', value: 'ur' }]}
                value={i18n.language}
                onChange={switchLang}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 12,
                }}
              />
            </div>

            {/* Form Title */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Sign In
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                Enter your credentials to access the POS system
              </p>
            </div>

            {/* Clean Form Controls */}
            <Form layout="vertical" onFinish={onFinish} size="large">
              <Form.Item name="username" rules={[{ required: true, message: 'Username is required' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: '#64748b' }} />}
                  placeholder={t('auth.username')}
                  autoComplete="username"
                  style={{
                    borderRadius: 10,
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    height: 46,
                  }}
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#64748b' }} />}
                  placeholder={t('auth.password')}
                  autoComplete="current-password"
                  style={{
                    borderRadius: 10,
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    height: 46,
                  }}
                  iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined style={{ color: '#64748b' }} />}
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
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>
              v2.4 Commercial Edition
            </span>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>
              © {new Date().getFullYear()} Hassan Traderz
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Tech Artwork Showcase */}
        <div style={{
          flex: 0.95,
          position: 'relative',
          overflow: 'hidden',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#090d16',
          display: 'flex',
        }}>
          <img
            src="/login_gadgets.jpg"
            alt="Mobile POS System"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
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
            <p style={{ color: '#94a3b8', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
              POS Billing • Inventory Control • Repair Work Orders • Khata Ledger
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
