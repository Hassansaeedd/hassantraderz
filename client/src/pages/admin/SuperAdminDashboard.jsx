// client/src/pages/admin/SuperAdminDashboard.jsx — Master Super Admin Platform Dashboard
import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Button, Tag, Space, Modal, Form, Input,
  Select, Typography, Statistic, message, Popconfirm, Tooltip, Alert
} from 'antd';
import {
  ShopOutlined, KeyOutlined, UserAddOutlined, ClockCircleOutlined,
  CheckCircleOutlined, StopOutlined, ReloadOutlined, CopyOutlined,
  SearchOutlined, SafetyCertificateOutlined, CalendarOutlined, PhoneOutlined
} from '@ant-design/icons';
import api from '../../api/axiosInstance';
import { formatDateTime } from '../../utils/formatters';

const { Title, Text } = Typography;
const { Option } = Select;

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalShops: 0,
    activeLicenses: 0,
    trialLicenses: 0,
    expiringSoon: 0,
  });
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Register Shop Modal
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerForm] = Form.useForm();

  // Extend License Modal
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [extending, setExtending] = useState(false);
  const [extendForm] = Form.useForm();

  useEffect(() => {
    fetchStats();
    fetchShops();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      const data = res.data?.data || res.data;
      if (data) setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/shops');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setShops(list);
    } catch (err) {
      console.error('Failed to load registered shops:', err);
      message.error(err?.response?.data?.message || err?.message || 'Failed to load registered shops');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register New Shop
  const handleRegisterShop = async (values) => {
    setRegistering(true);
    try {
      const res = await api.post('/admin/register-shop', values);
      message.success(res.data?.message || 'Shop registered successfully!');
      setRegisterModalVisible(false);
      registerForm.resetFields();
      fetchStats();
      fetchShops();
    } catch (err) {
      message.error(err?.message || 'Failed to register shop');
    } finally {
      setRegistering(false);
    }
  };

  // Handle Extend License
  const handleExtendLicense = async (values) => {
    if (!selectedShop) return;
    setExtending(true);
    try {
      await api.post(`/admin/shops/${selectedShop.id}/extend-license`, {
        days: values.duration === 'LIFETIME' ? 0 : Number(values.duration),
        isLifetime: values.duration === 'LIFETIME',
      });
      message.success(`License extended for ${selectedShop.ownerName}`);
      setExtendModalVisible(false);
      fetchStats();
      fetchShops();
    } catch (err) {
      message.error(err?.message || 'Failed to extend license');
    } finally {
      setExtending(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (shop) => {
    const nextStatus = shop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/shops/${shop.id}/status`, { status: nextStatus });
      message.success(`Shop status changed to ${nextStatus}`);
      fetchStats();
      fetchShops();
    } catch (err) {
      message.error('Failed to update shop status');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  const filteredShops = shops.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.ownerName?.toLowerCase().includes(q) ||
      s.username?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.license?.shopName?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      title: 'Client Shop & Owner',
      key: 'shopInfo',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
            {r.license?.shopName || r.ownerName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Owner: <b>{r.ownerName}</b>
          </div>
        </div>
      ),
    },
    {
      title: 'Credentials & Phone',
      key: 'credentials',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>
            User: {r.username}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {r.phone}
          </div>
        </div>
      ),
    },
    {
      title: 'License Duration',
      key: 'licensePlan',
      render: (_, r) => {
        const d = r.license?.duration || '15_DAYS';
        const isTrial = d === '15_DAYS' || d.includes('TRIAL');
        const isLife = d === 'LIFETIME' || !r.license?.expiresAt;

        return (
          <Tag color={isLife ? 'purple' : isTrial ? 'orange' : 'blue'} style={{ fontWeight: 700, padding: '3px 8px' }}>
            {isLife ? '👑 LIFETIME' : isTrial ? '⏳ 15-Day Free Trial' : `🛡️ ${d.replace('_', ' ')}`}
          </Tag>
        );
      },
    },
    {
      title: 'Expiry Date',
      key: 'expiry',
      render: (_, r) => {
        if (!r.license?.expiresAt || r.license?.duration === 'LIFETIME') {
          return <Tag color="green">Never (Lifetime)</Tag>;
        }
        const exp = new Date(r.license.expiresAt);
        const isPast = exp < new Date();
        const diffDays = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));

        return (
          <div>
            <div style={{ fontWeight: 700, color: isPast ? '#ef4444' : diffDays <= 7 ? '#f59e0b' : 'var(--text)' }}>
              {exp.toLocaleDateString()}
            </div>
            <div style={{ fontSize: 11, color: isPast ? '#ef4444' : 'var(--text-muted)' }}>
              {isPast ? 'Expired' : `${diffDays} days left`}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, r) => (
        <Tag color={r.status === 'ACTIVE' ? 'success' : 'error'} style={{ fontWeight: 700 }}>
          {r.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'}
        </Tag>
      ),
    },
    {
      title: 'License Key',
      key: 'licenseKey',
      render: (_, r) => {
        const key = r.license?.licenseKey || 'N/A';
        return (
          <Space>
            <Text code style={{ fontSize: 11.5 }}>{key}</Text>
            {key !== 'N/A' && (
              <Tooltip title="Copy License Key">
                <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(key)} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<ClockCircleOutlined />}
            onClick={() => {
              setSelectedShop(r);
              extendForm.setFieldsValue({ duration: '30' });
              setExtendModalVisible(true);
            }}
            style={{ fontWeight: 600 }}
          >
            Extend Key
          </Button>

          <Popconfirm
            title={`Are you sure you want to ${r.status === 'ACTIVE' ? 'suspend' : 'activate'} this shop?`}
            onConfirm={() => handleToggleStatus(r)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger={r.status === 'ACTIVE'}
              icon={r.status === 'ACTIVE' ? <StopOutlined /> : <CheckCircleOutlined />}
            >
              {r.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={2} style={{ color: 'var(--text)', margin: 0, fontWeight: 900 }}>
            <SafetyCertificateOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            Super Admin Portal
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
            Master License Management, Client Shop Provisioning & Multi-Tenant Control
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchShops(); }} size="large">
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setRegisterModalVisible(true)}
            size="large"
            style={{ fontWeight: 800, borderRadius: 10, background: '#2563eb' }}
          >
            + Register New Client Shop
          </Button>
        </Space>
      </div>

      {/* KPI Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 12 }} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Registered Client Shops</span>}
              value={stats.totalShops}
              prefix={<ShopOutlined style={{ color: '#3b82f6', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 900, color: 'var(--text)' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 12 }} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Active Licenses</span>}
              value={stats.activeLicenses}
              prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 900, color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 12 }} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Free Trial Shops</span>}
              value={stats.trialLicenses}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 900, color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 12 }} bodyStyle={{ padding: 18 }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Expiring in 7 Days</span>}
              value={stats.expiringSoon}
              prefix={<CalendarOutlined style={{ color: '#ef4444', marginRight: 8 }} />}
              valueStyle={{ fontWeight: 900, color: '#ef4444' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Client Shops Directory */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>
              Registered Mobile Shops Directory ({filteredShops.length})
            </span>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Search by shop name, owner, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 300, borderRadius: 8 }}
              allowClear
            />
          </div>
        }
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 12 }}
      >
        <Table
          dataSource={filteredShops}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* ── MODAL: REGISTER NEW CLIENT SHOP ── */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Register New Client Mobile Shop</span>}
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={560}
      >
        <Alert
          type="info"
          showIcon
          message="Provision Dedicated Client Shop"
          description="Create client shop login credentials and assign a license. The client will log in with a 100% clean, private database."
          style={{ marginBottom: 18 }}
        />

        <Form form={registerForm} layout="vertical" onFinish={handleRegisterShop} size="large">
          <Form.Item
            name="shopName"
            label={<span style={{ fontWeight: 700 }}>Mobile Shop Name (دکان کا نام)</span>}
            rules={[{ required: true, message: 'Please enter shop name' }]}
          >
            <Input placeholder="e.g. Usman Mobile Communication" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="ownerName"
                label={<span style={{ fontWeight: 700 }}>Owner Full Name (مالک کا نام)</span>}
                rules={[{ required: true, message: 'Please enter owner name' }]}
              >
                <Input placeholder="e.g. Muhammad Usman" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={<span style={{ fontWeight: 700 }}>Phone / WhatsApp</span>}
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="03001234567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="username"
                label={<span style={{ fontWeight: 700 }}>Login Username (یوزرنیم)</span>}
                rules={[{ required: true, message: 'Please enter username', min: 3 }]}
              >
                <Input placeholder="e.g. usman123" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label={<span style={{ fontWeight: 700 }}>Login Password (پاس ورڈ)</span>}
                rules={[{ required: true, message: 'Please enter password', min: 6 }]}
              >
                <Input.Password placeholder="Min 6 characters" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="duration"
            label={<span style={{ fontWeight: 700 }}>License Duration & Plan (لائسنس کی مدت)</span>}
            initialValue="15_DAYS"
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Option value="15_DAYS">⏳ 15-Day Free Trial (15 دن کا فری ٹرائل)</Option>
              <Option value="30_DAYS">🛡️ 1 Month Subscription (1 ماہ کا لائسنس)</Option>
              <Option value="90_DAYS">🛡️ 3 Months Subscription (3 ماہ کا لائسنس)</Option>
              <Option value="180_DAYS">🛡️ 6 Months Subscription (6 ماہ کا لائسنس)</Option>
              <Option value="365_DAYS">🛡️ 1 Year Subscription (1 سال کا فل لائسنس)</Option>
              <Option value="LIFETIME">👑 Lifetime Permanent License (لائف ٹائم فل ایکسیس)</Option>
            </Select>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={registering}
            style={{ height: 48, fontWeight: 800, borderRadius: 10, marginTop: 8 }}
          >
            Register Shop & Generate License
          </Button>
        </Form>
      </Modal>

      {/* ── MODAL: EXTEND / RENEW LICENSE ── */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Extend / Renew License for {selectedShop?.ownerName}</span>}
        open={extendModalVisible}
        onCancel={() => setExtendModalVisible(false)}
        footer={null}
        width={440}
      >
        <Form form={extendForm} layout="vertical" onFinish={handleExtendLicense} size="large">
          <Form.Item
            name="duration"
            label={<span style={{ fontWeight: 700 }}>Extend Duration By:</span>}
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Option value="15">Add 15 Days</Option>
              <Option value="30">Add 30 Days (1 Month)</Option>
              <Option value="90">Add 90 Days (3 Months)</Option>
              <Option value="180">Add 180 Days (6 Months)</Option>
              <Option value="365">Add 365 Days (1 Year)</Option>
              <Option value="LIFETIME">👑 Upgrade to Lifetime (Permanent)</Option>
            </Select>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={extending}
            style={{ height: 46, fontWeight: 800, borderRadius: 10, marginTop: 8 }}
          >
            Apply License Extension
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
