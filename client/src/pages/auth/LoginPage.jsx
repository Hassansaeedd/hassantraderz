// client/src/pages/auth/LoginPage.jsx — Unified Login & Shop Self-Registration Portal
import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Segmented, Row, Col, Alert, Tag } from 'antd';
import {
  UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone,
  SunOutlined, MoonOutlined, ShopOutlined, PhoneOutlined,
  KeyOutlined, CheckCircleOutlined, SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
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

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Login (Admin, Manager, or Shop Cashier)
  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', values);
      const user = res.data.user;
      const token = res.data.accessToken;
      setAuth(user, token);
      message.success(`Welcome back, ${user.fullName || user.username}!`);
      
      if (user.role === 'ADMIN') {
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

  // Handle Self-Registration with 15-Day Free Trial
  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', values);
      const user = res.data?.user || res.data?.data?.user;
      const token = res.data?.accessToken || res.data?.data?.accessToken;
      const lic = res.data?.license || res.data?.data?.license;

      if (user && token) {
        setAuth(user, token);
        if (lic) {
          localStorage.setItem('software_license', JSON.stringify({
            licenseKey: lic.licenseKey,
            plan: '15-Day Free Trial',
            status: 'ACTIVE',
            activatedOn: new Date().toLocaleDateString(),
            expiresOn: new Date(lic.expiresAt).toLocaleDateString(),
            shopName: lic.shopName,
          }));
        }
        message.success(`🎉 Welcome to Hassan Traderz! Your 15-Day Free Trial is active!`);
        navigate('/dashboard');
      }
    } catch (err) {
      message.error(err?.message || 'Registration failed. Username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Super Admin Fill
  const handleQuickFillAdmin = () => {
    loginForm.setFieldsValue({
      username: 'admin',
      password: 'Admin@123',
    });
    message.info('Filled Super Admin credentials (admin / Admin@123)');
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
        background: isDark ? 'radial-gradient(circle, rgba(37, 99, 235, 0.09) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(37, 99, 235, 0.07) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? 440 : 960,
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
        minHeight: isMobile ? 'auto' : 560,
      }}>

        {/* LEFT PANEL: Form with Sign In & Register Tabs */}
        <div style={{
          flex: 1.2,
          padding: isMobile ? '24px 18px' : '36px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Top Bar: Brand, Theme Switcher & Language */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/logo.png"
                  alt="Hassan Traderz Logo"
                  style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }}
                />
                <div>
                  <h1 style={{ fontSize: 17, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', margin: 0 }}>
                    Hassan Traderz
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

            {/* TAB SELECTOR: Sign In vs Register New Shop */}
            <Segmented
              block
              size="large"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { label: '🔑 Sign In / Admin Login', value: 'login' },
                { label: '✨ Register Shop (15-Day Free Trial)', value: 'register' },
              ]}
              style={{
                marginBottom: 20,
                padding: 4,
                borderRadius: 12,
                fontWeight: 700,
                background: isDark ? 'rgba(30, 41, 59, 0.8)' : '#e2e8f0',
              }}
            />

            {/* ──────── TAB 1: SIGN IN (ADMIN & CASHIER) ──────── */}
            {activeTab === 'login' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', margin: 0 }}>
                    Sign In to Portal
                  </h2>
                  <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12.5, margin: '2px 0 0' }}>
                    Enter credentials to access POS counter or Super Admin Panel
                  </p>
                </div>

                <Form form={loginForm} layout="vertical" onFinish={handleLogin} size="large">
                  <Form.Item name="username" rules={[{ required: true, message: 'Username is required' }]}>
                    <Input
                      prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="Username (e.g. admin or shop username)"
                      style={{ borderRadius: 10, height: 44 }}
                    />
                  </Form.Item>

                  <Form.Item name="password" rules={[{ required: true, message: 'Password is required' }]}>
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                      placeholder="Password"
                      style={{ borderRadius: 10, height: 44 }}
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    style={{
                      height: 46,
                      borderRadius: 10,
                      fontSize: 14.5,
                      fontWeight: 800,
                      background: '#2563eb',
                      borderColor: '#2563eb',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                      marginTop: 4,
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </Button>
                </Form>

                {/* Quick 1-Click Super Admin Fill Button */}
                <div style={{
                  marginTop: 16,
                  padding: '10px 12px',
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9',
                  borderRadius: 10,
                  border: isDark ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: isDark ? '#f8fafc' : '#0f172a' }}>
                      👑 Master Admin Login
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                      User: <code>admin</code> | Pass: <code>Admin@123</code>
                    </div>
                  </div>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<ThunderboltOutlined />}
                    onClick={handleQuickFillAdmin}
                    style={{ borderRadius: 6, fontWeight: 700 }}
                  >
                    1-Click Admin
                  </Button>
                </div>
              </div>
            )}

            {/* ──────── TAB 2: REGISTER NEW SHOP (15-DAY FREE TRIAL) ──────── */}
            {activeTab === 'register' && (
              <div>
                <Alert
                  type="info"
                  showIcon
                  icon={<CheckCircleOutlined style={{ color: '#2563eb' }} />}
                  message="15-Day Free Trial Included"
                  description="Register your mobile shop to test Barcodes, POS Billing, Repairs, and Khata."
                  style={{ marginBottom: 16, borderRadius: 10 }}
                />

                <Form form={registerForm} layout="vertical" onFinish={handleRegister} size="middle">
                  <Form.Item
                    name="shopName"
                    label={<span style={{ fontWeight: 700, fontSize: 12.5 }}>Mobile Shop Name (دکان کا نام)</span>}
                    rules={[{ required: true, message: 'Shop name is required' }]}
                    style={{ marginBottom: 12 }}
                  >
                    <Input prefix={<ShopOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. Al-Madina Mobile Center" />
                  </Form.Item>

                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item
                        name="ownerName"
                        label={<span style={{ fontWeight: 700, fontSize: 12.5 }}>Owner Name</span>}
                        rules={[{ required: true, message: 'Required' }]}
                        style={{ marginBottom: 12 }}
                      >
                        <Input placeholder="e.g. Zubair Ahmad" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="phone"
                        label={<span style={{ fontWeight: 700, fontSize: 12.5 }}>WhatsApp Phone</span>}
                        rules={[{ required: true, message: 'Required' }]}
                        style={{ marginBottom: 12 }}
                      >
                        <Input placeholder="03001234567" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={8}>
                    <Col span={12}>
                      <Form.Item
                        name="username"
                        label={<span style={{ fontWeight: 700, fontSize: 12.5 }}>Login Username</span>}
                        rules={[{ required: true, message: 'Required', min: 3 }]}
                        style={{ marginBottom: 12 }}
                      >
                        <Input placeholder="e.g. madinamobile" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="password"
                        label={<span style={{ fontWeight: 700, fontSize: 12.5 }}>Login Password</span>}
                        rules={[{ required: true, message: 'Required', min: 6 }]}
                        style={{ marginBottom: 12 }}
                      >
                        <Input.Password placeholder="Min 6 chars" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      borderColor: '#2563eb',
                      marginTop: 4,
                    }}
                  >
                    {loading ? 'Creating Shop...' : 'Start 15-Day Free Trial'}
                  </Button>
                </Form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 20, paddingTop: 12, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
              Hassan Traderz Commercial POS
            </span>
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
              ● Cloud Online
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Tech Showcase Feature Grid (Desktop Only) */}
        {!isMobile && (
          <div style={{
            flex: 0.9,
            background: isDark
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            padding: '36px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
          }}>
            <div>
              <Tag color="blue" style={{ fontWeight: 800, borderRadius: 6, marginBottom: 12 }}>
                MULTI-SHOP POS & REPAIRS
              </Tag>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', margin: '0 0 10px', lineHeight: 1.3 }}>
                Everything your Mobile Shop needs in one place
              </h3>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                Manage smartphones, bulk CSV stock, barcode scanning, customer Khata ledgers, and technician repair work orders.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { title: 'Super Admin License Manager', desc: 'Issue 15-Day to Lifetime Keys for client shops' },
                  { title: 'Customer Khata (ادھار کھاتہ)', desc: 'Automatic debit/credit ledger & statement prints' },
                  { title: 'Mobile Repair Work Orders', desc: 'Diagnostic tickets and claim receipts' },
                  { title: 'Thermal & WhatsApp Invoices', desc: '80mm instant receipts with 1-click WhatsApp' },
                ].map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <CheckCircleOutlined style={{ color: '#10b981', marginTop: 3 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: isDark ? '#f8fafc' : '#1e293b' }}>{feat.title}</div>
                      <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)',
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 11.5,
              color: isDark ? '#94a3b8' : '#475569',
            }}>
              <SafetyCertificateOutlined style={{ color: '#2563eb', marginRight: 6 }} />
              Protected by Hardware Machine Lock & Cloud Sync.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
