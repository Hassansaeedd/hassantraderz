// client/src/pages/admin/LicenseManagementPage.jsx — Super Admin License & Multi-Shop Manager
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Form,
  InputNumber, Typography, Row, Col, message, Divider, Popconfirm, Tooltip
} from 'antd';
import {
  KeyOutlined, PlusOutlined, CopyOutlined, CheckCircleOutlined,
  StopOutlined, ReloadOutlined, SearchOutlined, ClockCircleOutlined,
  ShopOutlined, SafetyCertificateOutlined, CrownOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatDateTime } from '../../utils/formatters';

const { Option } = Select;
const { Title, Text } = Typography;

export default function LicenseManagementPage() {
  const { t } = useTranslation();

  const [licenses, setLicenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, activeCount: 0, expiredCount: 0, lifetimeCount: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [durationFilter, setDurationFilter] = useState(null);

  // Generate Key Modal
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [generating, setGenerating] = useState(false);

  // Extend Modal
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedLic, setSelectedLic] = useState(null);
  const [extendDays, setExtendDays] = useState(30);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async (q = search, st = statusFilter, dur = durationFilter) => {
    setLoading(true);
    try {
      let url = '/licenses?';
      if (q) url += `search=${encodeURIComponent(q)}&`;
      if (st) url += `status=${encodeURIComponent(st)}&`;
      if (dur) url += `duration=${encodeURIComponent(dur)}&`;

      const res = await api.get(url);
      const data = res.data?.licenses || (Array.isArray(res.data) ? res.data : []);
      const sum = res.data?.summary || { total: data.length, activeCount: 0, expiredCount: 0, lifetimeCount: 0 };
      setLicenses(data);
      setSummary(sum);
    } catch {
      message.error('Failed to load license records');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKeys = async (values) => {
    setGenerating(true);
    try {
      const res = await api.post('/licenses/generate', values);
      message.success(res.message || 'License key(s) generated successfully!');
      setGenerateModalVisible(false);
      form.resetFields();
      fetchLicenses();
    } catch (err) {
      message.error(err?.message || 'Failed to generate license key');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/licenses/${id}/status`, { status: newStatus });
      message.success(`License status updated to ${newStatus}`);
      fetchLicenses();
    } catch (err) {
      message.error(err?.message || 'Failed to update status');
    }
  };

  const handleExtendDuration = async () => {
    if (!selectedLic) return;
    try {
      await api.patch(`/licenses/${selectedLic.id}/status`, { extendDays });
      message.success(`License extended by ${extendDays} days!`);
      setExtendModalVisible(false);
      fetchLicenses();
    } catch (err) {
      message.error(err?.message || 'Failed to extend license');
    }
  };

  const handleMakeLifetime = async (id) => {
    try {
      await api.patch(`/licenses/${id}/status`, { newDuration: 'LIFETIME' });
      message.success('License converted to Lifetime Commercial Enterprise!');
      fetchLicenses();
    } catch (err) {
      message.error(err?.message || 'Failed to convert to lifetime');
    }
  };

  const handleDeleteLicense = async (id) => {
    try {
      await api.delete(`/licenses/${id}`);
      message.success('License deleted');
      fetchLicenses();
    } catch (err) {
      message.error(err?.message || 'Failed to delete license');
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    message.success(`Copied License Key: ${key}`);
  };

  const formatDurationLabel = (dur) => {
    switch (dur) {
      case '15_DAYS': return '15-Day Free Trial';
      case '30_DAYS': return '1 Month (30 Days)';
      case '90_DAYS': return '3 Months (Quarterly)';
      case '180_DAYS': return '6 Months (Half-Year)';
      case '365_DAYS': return '1 Year (Annual)';
      case 'LIFETIME': return 'Lifetime Enterprise';
      default: return dur;
    }
  };

  const columns = [
    {
      title: 'License Key (سیریل کی)',
      dataIndex: 'licenseKey',
      key: 'licenseKey',
      render: (key) => (
        <Space>
          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', fontSize: 13.5 }}>
            {key}
          </span>
          <Tooltip title="Copy Key to Clipboard">
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopyKey(key)} />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Shop / Owner (دکان)',
      key: 'shop',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>
            <ShopOutlined style={{ marginRight: 6, color: 'var(--primary)' }} />
            {r.shopName || 'Unassigned'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {r.ownerName ? `${r.ownerName} • ${r.ownerPhone || 'No Phone'}` : (r.user?.username ? `@${r.user.username}` : 'Direct Key')}
          </div>
        </div>
      ),
    },
    {
      title: 'Duration Plan',
      dataIndex: 'duration',
      key: 'duration',
      render: (dur) => (
        <Tag color={dur === 'LIFETIME' ? 'purple' : dur === '15_DAYS' ? 'orange' : 'blue'} style={{ fontWeight: 700 }}>
          {dur === 'LIFETIME' && <CrownOutlined style={{ marginRight: 4 }} />}
          {formatDurationLabel(dur)}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (r) => {
        const st = r.effectiveStatus || r.status;
        if (st === 'REVOKED') return <Tag color="red" style={{ fontWeight: 700 }}>REVOKED</Tag>;
        if (st === 'EXPIRED') return <Tag color="volcano" style={{ fontWeight: 700 }}>EXPIRED</Tag>;
        return <Tag color="green" style={{ fontWeight: 700 }}>ACTIVE</Tag>;
      },
    },
    {
      title: 'Days Left / Expiry',
      key: 'expiry',
      render: (r) => {
        if (r.duration === 'LIFETIME') {
          return <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Never (Lifetime)</span>;
        }
        if (r.isExpired) {
          return <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Expired ({formatDateTime(r.expiresAt)})</span>;
        }
        return (
          <div>
            <span style={{ fontWeight: 800, color: r.daysRemaining <= 3 ? 'var(--danger)' : 'var(--success)' }}>
              {r.daysRemaining} days left
            </span>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Expires: {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (r) => (
        <Space wrap size="small">
          <Button
            size="small"
            onClick={() => {
              setSelectedLic(r);
              setExtendModalVisible(true);
            }}
          >
            Extend
          </Button>

          {r.duration !== 'LIFETIME' && (
            <Popconfirm title="Upgrade this shop to Lifetime Commercial License?" onConfirm={() => handleMakeLifetime(r.id)}>
              <Button size="small" type="dashed" style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}>
                Lifetime
              </Button>
            </Popconfirm>
          )}

          {r.status === 'ACTIVE' ? (
            <Popconfirm title="Suspend/Revoke this shop's license?" onConfirm={() => handleUpdateStatus(r.id, 'REVOKED')}>
              <Button size="small" danger icon={<StopOutlined />}>Revoke</Button>
            </Popconfirm>
          ) : (
            <Button size="small" type="primary" onClick={() => handleUpdateStatus(r.id, 'ACTIVE')}>
              Activate
            </Button>
          )}

          <Popconfirm title="Delete this license permanently?" onConfirm={() => handleDeleteLicense(r.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <SafetyCertificateOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            Software License & Multi-Shop Manager (لائسنس مینجمنٹ)
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Generate serial activation keys (15 Days Trial to Lifetime), manage shop subscriptions, and control access
          </Text>
        </div>

        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => fetchLicenses()} />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setGenerateModalVisible(true)}
            style={{ fontWeight: 700, borderRadius: 8 }}
          >
            Generate New License Key
          </Button>
        </Space>
      </div>

      {/* KPI Stats Summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card">
            <div style={{ color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>Total Issued Licenses</div>
            <div style={{ color: 'var(--text)', fontSize: 24, fontWeight: 800, marginTop: 4 }}>{summary.total || licenses.length}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card success">
            <div style={{ color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>Active Subscriptions</div>
            <div style={{ color: 'var(--success)', fontSize: 24, fontWeight: 800, marginTop: 4 }}>{summary.activeCount || 0}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card danger">
            <div style={{ color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>Expired / Revoked</div>
            <div style={{ color: 'var(--danger)', fontSize: 24, fontWeight: 800, marginTop: 4 }}>{summary.expiredCount || 0}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="kpi-card" style={{ '--primary': '#8b5cf6' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>Lifetime Commercial</div>
            <div style={{ color: '#8b5cf6', fontSize: 24, fontWeight: 800, marginTop: 4 }}>{summary.lifetimeCount || 0}</div>
          </div>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', marginBottom: 16 }} bodyStyle={{ padding: 14 }}>
        <Row gutter={[10, 10]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Search by License Key, Shop Name, Phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchLicenses(e.target.value, statusFilter, durationFilter);
              }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                fetchLicenses(search, val, durationFilter);
              }}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="ACTIVE">Active</Option>
              <Option value="EXPIRED">Expired</Option>
              <Option value="REVOKED">Revoked</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Duration Plan"
              value={durationFilter}
              onChange={(val) => {
                setDurationFilter(val);
                fetchLicenses(search, statusFilter, val);
              }}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="15_DAYS">15 Days Trial</Option>
              <Option value="30_DAYS">1 Month (30 Days)</Option>
              <Option value="90_DAYS">3 Months (90 Days)</Option>
              <Option value="180_DAYS">6 Months (180 Days)</Option>
              <Option value="365_DAYS">1 Year (365 Days)</Option>
              <Option value="LIFETIME">Lifetime Enterprise</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setStatusFilter(null); setDurationFilter(null); fetchLicenses('', null, null); }} block>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Licenses Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <Table
          dataSource={licenses}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* GENERATE NEW LICENSE KEY MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Generate Serial License Key</span>}
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={null}
        width={540}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerateKeys} initialValues={{ duration: '15_DAYS', count: 1 }}>
          <Form.Item name="shopName" label="Target Shop Name (Optional)" tooltip="Leave blank if generating pre-paid bulk license keys">
            <Input placeholder="e.g. Al-Madina Mobile Center" size="large" />
          </Form.Item>

          <Row gutter={10}>
            <Col span={12}>
              <Form.Item name="ownerName" label="Owner Name (Optional)">
                <Input placeholder="e.g. Muhammad Zubair" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ownerPhone" label="WhatsApp Phone # (Optional)">
                <Input placeholder="03001234567" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={10}>
            <Col span={16}>
              <Form.Item name="duration" label="Subscription Duration (مدت)" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="15_DAYS">⏳ 15-Day Free Trial</Option>
                  <Option value="30_DAYS">📅 1 Month (30 Days)</Option>
                  <Option value="90_DAYS">📅 3 Months (Quarterly)</Option>
                  <Option value="180_DAYS">📅 6 Months (Half-Yearly)</Option>
                  <Option value="365_DAYS">🏆 1 Year (Annual)</Option>
                  <Option value="LIFETIME">👑 Lifetime Commercial Enterprise</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="count" label="Quantity">
                <InputNumber min={1} max={20} size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Admin Internal Notes (Optional)">
            <Input.TextArea rows={2} placeholder="e.g. Special Ramadan discount / Payment received in cash" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={generating}
            style={{ height: 46, fontWeight: 800, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          >
            Generate Unique License Key
          </Button>
        </Form>
      </Modal>

      {/* EXTEND DURATION MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800 }}>Extend License — {selectedLic?.shopName}</span>}
        open={extendModalVisible}
        onCancel={() => setExtendModalVisible(false)}
        onOk={handleExtendDuration}
        okText="Extend License"
      >
        <div style={{ padding: '10px 0' }}>
          <p>Select number of days to extend this shop's subscription:</p>
          <Select
            value={extendDays}
            onChange={setExtendDays}
            size="large"
            style={{ width: '100%', marginBottom: 14 }}
          >
            <Option value={15}>+15 Days Trial Extension</Option>
            <Option value={30}>+30 Days (1 Month)</Option>
            <Option value={60}>+60 Days (2 Months)</Option>
            <Option value={90}>+90 Days (3 Months)</Option>
            <Option value={180}>+180 Days (6 Months)</Option>
            <Option value={365}>+365 Days (1 Full Year)</Option>
          </Select>
          <Text type="secondary">The extra days will be added automatically to the current expiration date.</Text>
        </div>
      </Modal>
    </div>
  );
}
