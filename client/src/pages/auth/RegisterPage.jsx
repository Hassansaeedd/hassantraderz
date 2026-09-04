// client/src/pages/auth/RegisterPage.jsx — Shop Self-Registration with 15-Day Free Trial
import { useState } from 'react';
import { Form, Input, Button, message, Segmented, Row, Col } from 'antd';
import {
  ShopOutlined, UserOutlined, LockOutlined, PhoneOutlined,
  MailOutlined, SunOutlined, MoonOutlined, CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import api from '../../api/axiosInstance';

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { mode, toggleTheme } = useThemeStore();
  const isDark = mode === 'dark';
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
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
        message.success(`🎉 Welcome to Hassan Traderz POS! Your 15-Day Free Trial is active!`);
        navigate('/dashboard');
      }
    } catch (err) {
      message.error(err?.message || 'Registration failed. Please check details.');
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
      padding: '24px 16px',
      position: 'relative',
      background: isDark
        ? 'linear-gradient(145deg, #090d16 0%, #111827 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      overflowX: 'hidden',
      transition: 'background 0.3s ease',
    }}>
      {/* Main Glassmorphic Registration Container */}
      <div style={{
        width: '100%',
        maxWidth: 580,
        borderRadius: 20,
        overflow: 'hidden',
        background: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        padding: '36px 32px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
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
                Shop Registration & 15-Day Trial
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

        {/* Free Trial Banner */}
        <div style={{
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          padding: '12px 14px',
          borderRadius: 12,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <CheckCircleOutlined style={{ color: '#2563eb', fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 800, color: isDark ? '#93c5fd' : '#1d4ed8', fontSize: 13 }}>
              Instant 15-Day Free Trial Included
            </div>
            <div style={{ fontSize: 11.5, color: isDark ? '#cbd5e1' : '#475569' }}>
              Full access to POS, Barcodes, Inventory, Khata & Mobile Repairs. No credit card required.
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="shopName"
            label={<span style={{ fontWeight: 700 }}>Mobile Shop Name (دکان کا نام)</span>}
            rules={[{ required: true, message: 'Shop name is required' }]}
          >
            <Input prefix={<ShopOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. Al-Madina Mobile Center" />
          </Form.Item>

          <Row gutter={10}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="ownerName"
                label={<span style={{ fontWeight: 700 }}>Owner Full Name (مالک کا نام)</span>}
                rules={[{ required: true, message: 'Owner name is required' }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. Muhammad Zubair" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label={<span style={{ fontWeight: 700 }}>WhatsApp / Mobile #</span>}
                rules={[{ required: true, message: 'Phone number is required' }]}
              >
                <Input prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} placeholder="03001234567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={10}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="username"
                label={<span style={{ fontWeight: 700 }}>Login Username (یوزر نیم)</span>}
                rules={[{ required: true, message: 'Username is required', min: 3 }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="e.g. madinamobile" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="password"
                label={<span style={{ fontWeight: 700 }}>Login Password (پاس ورڈ)</span>}
                rules={[{ required: true, message: 'Password is required', min: 6 }]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Minimum 6 characters" />
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
              height: 48,
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 800,
              background: '#2563eb',
              borderColor: '#2563eb',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              marginTop: 10,
            }}
          >
            {loading ? 'Creating Shop Account...' : 'Start 15-Day Free Trial'}
          </Button>
        </Form>

        {/* Back to Sign In */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Already have an account? </span>
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
