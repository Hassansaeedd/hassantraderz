// client/src/pages/auth/LoginPage.jsx — Light-Theme Split Glassmorphic Login Portal with Official Logo
import { useState } from 'react';
import { Form, Input, Button, message, Segmented, Tag } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, SafetyCertificateOutlined, HddOutlined, LockFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();
  const setAuth      = useAuthStore(s => s.setAuth);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      setAuth(res.data.user, res.data.accessToken);
      message.success(`Welcome to Hassan Traderz POS, ${res.data.user.fullName}!`);
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
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      overflow: 'hidden',
    }}>
      {/* Ambient Soft Light Radial Glowing Orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '15%', width: 550, height: 550,
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(255, 255, 255, 0) 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '15%', width: 550, height: 550,
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* Main Glassmorphic Container (Split Layout) */}
      <div style={{
        width: '100%', maxWidth: 960, display: 'flex', borderRadius: 28, overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 25px 70px rgba(15, 23, 42, 0.09), 0 6px 24px rgba(16, 185, 129, 0.06)',
        position: 'relative', zIndex: 1, minHeight: 540,
      }}>

        {/* LEFT PANEL: Login Form */}
        <div style={{
          flex: 1.1, padding: '38px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Tag color="green" style={{
                borderRadius: 20, background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)', color: '#059669', fontWeight: 700, padding: '2px 10px',
              }}>
                v2.4 Enterprise
              </Tag>

              <Segmented
                options={[{ label: 'English', value: 'en' }, { label: 'اردو', value: 'ur' }]}
                value={i18n.language}
                onChange={switchLang}
                style={{ background: 'rgba(241, 245, 249, 0.9)', border: '1px solid rgba(0,0,0,0.06)' }}
              />
            </div>

            {/* Official Logo Emblem & Heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <img
                src="/logo.png"
                alt="Hassan Traderz Logo"
                style={{
                  width: 52, height: 52, borderRadius: 16, objectFit: 'cover',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              />
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: -0.3 }}>
                  Hassan Traderz
                </h1>
                <div style={{ color: '#059669', fontSize: 13, fontWeight: 700, fontFamily: "'Noto Nastaliq Urdu', serif" }}>
                  حسن ٹریڈرز - موبائل ہاؤس اینڈ ریپئرنگ
                </div>
              </div>
            </div>

            {/* Auto Security Notice */}
            <div style={{
              padding: '6px 12px', marginBottom: 20, borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#047857', fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <LockFilled style={{ color: '#059669' }} /> Auto-Security: Logs out when software closes
            </div>

            {/* Form */}
            <Form layout="vertical" onFinish={onFinish} size="large">
              <Form.Item name="username" rules={[{ required: true, message: 'Username required' }]}>
                <Input
                  prefix={<UserOutlined style={{ color: '#059669' }} />}
                  placeholder={t('auth.username')}
                  autoComplete="username"
                  style={{
                    borderRadius: 10, background: '#fff', border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                />
              </Form.Item>

              <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#059669' }} />}
                  placeholder={t('auth.password')}
                  autoComplete="current-password"
                  style={{
                    borderRadius: 10, background: '#fff', border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                  }}
                  iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 18, marginBottom: 12 }}>
                <Button
                  type="primary" htmlType="submit" block loading={loading}
                  style={{
                    height: 46, borderRadius: 10, fontSize: 15, fontWeight: 800,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  {loading ? t('auth.loggingIn') : 'Sign In to Counter'}
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* Machine License Hardware Lock & Demo Logins */}
          <div>
            <div style={{
              padding: '8px 12px', background: 'rgba(241, 245, 249, 0.8)',
              borderRadius: 10, border: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: 10,
            }}>
              <div style={{ color: '#059669', fontSize: 10, fontWeight: 800, letterSpacing: 0.8, marginBottom: 2 }}>
                <SafetyCertificateOutlined /> DEMO LOGINS
              </div>
              <div style={{ color: '#475569', fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                <span><b>Admin:</b> admin / Admin@123</span>
                <span><b>Cashier:</b> cashier / Cashier@123</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
              <HddOutlined style={{ color: '#059669' }} /> Licensed Machine ID: <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>HT-9F82-PK</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Mobile Phones & Accessories Tech Showcase Picture */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          borderLeft: '1px solid rgba(255, 255, 255, 0.8)',
          background: '#0f172a',
        }}>
          <img
            src="/login_gadgets.jpg"
            alt="Mobile Phones & Tech Accessories"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Gradient Overlay & Showcase Caption */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 32,
          }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
              width: 'fit-content', marginBottom: 8,
            }}>
              Smartphones & Tech Gadgets
            </div>

            <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.3 }}>
              Mobile Shop POS & Inventory System
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
              Smartphones • Accessories • Repair Tickets • Used Mobile Trade-In • Customer Khata
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
