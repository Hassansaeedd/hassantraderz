// client/src/pages/repairs/RepairsPage.jsx — Mobile Repair Work Order Tickets with Database Persistence
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Form,
  Typography, Row, Col, message, Divider, Alert, InputNumber
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ToolOutlined, PrinterOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Option } = Select;
const { Title, Text } = Typography;

export default function RepairsPage() {
  const { t } = useTranslation();

  const [repairs, setRepairs]         = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [form]                        = Form.useForm();
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    fetchRepairs();
    fetchCustomers();
  }, []);

  const fetchRepairs = async (q = search, st = statusFilter) => {
    setLoading(true);
    try {
      let url = '/repairs?';
      if (q) url += `search=${encodeURIComponent(q)}&`;
      if (st) url += `status=${encodeURIComponent(st)}&`;
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || res || []);
      setRepairs(data);
    } catch {
      // Fallback
      const stored = localStorage.getItem('repair_tickets');
      if (stored) setRepairs(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch {}
  };

  const handleCreateTicket = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deviceModel: values.deviceModel,
        imei: values.imei || null,
        faultDescription: values.problemDescription || values.faultDescription,
        technicianNotes: values.technicianNotes || null,
        estimatedCost: Number(values.estimatedCost || 0),
        advanceDeposit: Number(values.depositPaid || values.advanceDeposit || 0),
      };

      const res = await api.post('/repairs', payload);
      const newTicket = res.data?.data || res.data || res;

      message.success(`Repair ticket ${newTicket.ticketNo || 'created'} saved to database!`);
      setCreateModalVisible(false);
      form.resetFields();
      fetchRepairs();
    } catch (err) {
      message.error(err?.message || 'Failed to save repair ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      await api.patch(`/repairs/${ticketId}/status`, { status: nextStatus });
      message.success(`Ticket status updated to ${nextStatus}`);
      fetchRepairs();
    } catch (err) {
      message.error(err?.message || 'Failed to update status');
    }
  };

  const handlePrintClaimTag = (record) => {
    setSelectedTicket(record);
    setClaimModalVisible(true);
  };

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
      render: (v) => (
        <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
          {v}
        </span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{r.customerName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.customerPhone}</div>
        </div>
      ),
    },
    {
      title: 'Device & Fault',
      key: 'device',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.deviceModel}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.faultDescription}</div>
        </div>
      ),
    },
    {
      title: 'Est. Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      render: (v) => <span style={{ fontWeight: 700 }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Advance',
      dataIndex: 'advanceDeposit',
      key: 'advanceDeposit',
      render: (v) => <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st, r) => {
        let color = 'blue';
        if (st === 'RECEIVED') color = 'default';
        if (st === 'IN_REPAIR') color = 'orange';
        if (st === 'READY') color = 'green';
        if (st === 'DELIVERED') color = 'purple';

        return (
          <Select
            value={st}
            size="small"
            style={{ width: 130 }}
            onChange={(val) => handleStatusChange(r.id, val)}
          >
            <Option value="RECEIVED">Received</Option>
            <Option value="IN_REPAIR">In Repair</Option>
            <Option value="READY">Ready</Option>
            <Option value="DELIVERED">Delivered</Option>
            <Option value="CANCELLED">Cancelled</Option>
          </Select>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Button
          size="small"
          icon={<PrinterOutlined />}
          onClick={() => handlePrintClaimTag(r)}
          style={{ borderRadius: 6 }}
        >
          Claim Tag
        </Button>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
            Mobile Repair Work Orders (موبائل ریپئرنگ ورک آرڈر)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Job tickets, diagnostic logs, status workflows, and 80mm customer claim receipts
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setCreateModalVisible(true)}
          style={{ fontWeight: 700 }}
        >
          New Repair Ticket
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[10, 10]}>
          <Col xs={24} md={12}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Search by Ticket #, Customer, Device model, IMEI..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchRepairs(e.target.value, statusFilter);
              }}
              allowClear
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                fetchRepairs(search, val);
              }}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="RECEIVED">Received</Option>
              <Option value="IN_REPAIR">In Repair</Option>
              <Option value="READY">Ready for Pickup</Option>
              <Option value="DELIVERED">Delivered</Option>
            </Select>
          </Col>
          <Col xs={12} md={6}>
            <Button icon={<ReloadOutlined />} onClick={() => fetchRepairs()} block>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={repairs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* CREATE REPAIR TICKET MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800 }}>Create Mobile Repair Work Order</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Usman Ali" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerPhone" label="Customer Phone" rules={[{ required: true }]}>
                <Input placeholder="e.g. 03001234567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="deviceModel" label="Device Model" rules={[{ required: true }]}>
                <Input placeholder="e.g. iPhone 13 Pro / Samsung A54" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imei" label="IMEI / Serial Number (Optional)">
                <Input placeholder="15-digit IMEI" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="faultDescription" label="Fault / Problem Description" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="e.g. Screen glass broken, touch unresponsive" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="estimatedCost" label="Estimated Cost (₨)">
                <InputNumber style={{ width: '100%' }} placeholder="e.g. 12000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="advanceDeposit" label="Advance Deposit Paid (₨)">
                <InputNumber style={{ width: '100%' }} placeholder="e.g. 2000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="technicianNotes" label="Internal Technician Notes (Optional)">
            <Input placeholder="e.g. OLED replacement required" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ fontWeight: 700, marginTop: 10 }}>
            Save Work Order to Database
          </Button>
        </Form>
      </Modal>

      {/* 80mm CLAIM TAG MODAL */}
      <Modal
        title="Customer Repair Claim Tag (80mm)"
        open={claimModalVisible}
        onCancel={() => setClaimModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setClaimModalVisible(false)}>Close</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Claim Tag
          </Button>
        ]}
      >
        {selectedTicket && (
          <div style={{ background: '#fff', color: '#000', padding: 16, fontFamily: 'monospace', borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>PRIMECELL POS REPAIR LAB</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>Main Bazaar, Lahore | Ph: 0300-0000000</div>
            <Divider style={{ margin: '8px 0' }} />
            <div><b>Claim Tag #:</b> {selectedTicket.ticketNo}</div>
            <div><b>Customer:</b> {selectedTicket.customerName} ({selectedTicket.customerPhone})</div>
            <div><b>Device:</b> {selectedTicket.deviceModel}</div>
            <div><b>Fault:</b> {selectedTicket.faultDescription}</div>
            <Divider style={{ margin: '8px 0' }} />
            <div><b>Est. Cost:</b> ₨ {Number(selectedTicket.estimatedCost || 0).toLocaleString()}</div>
            <div><b>Advance Deposit:</b> ₨ {Number(selectedTicket.advanceDeposit || 0).toLocaleString()}</div>
            <div style={{ fontWeight: 'bold', fontSize: 13, color: '#dc2626' }}>
              <b>Balance Due:</b> ₨ {Math.max(0, (selectedTicket.estimatedCost || 0) - (selectedTicket.advanceDeposit || 0)).toLocaleString()}
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ textAlign: 'center', fontSize: 10, color: '#64748b' }}>
              Please bring this slip to collect your device. Warranty valid for 7 days on replaced parts.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
