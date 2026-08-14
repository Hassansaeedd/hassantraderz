// client/src/pages/repairs/RepairsPage.jsx — Mobile Repair Work Order Tickets (Fixed Tag Colors for Light/Dark Mode)
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
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form]                        = Form.useForm();
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    fetchRepairs();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('repair_tickets');
      if (stored) {
        setRepairs(JSON.parse(stored));
      } else {
        const initial = [
          {
            id: 'REP-1001', ticketNo: 'REP-2026-001', customerName: 'Usman Ali', customerPhone: '03018889900',
            deviceModel: 'Samsung A54 5G', imeiSerial: '358920194829102', problemDescription: 'Screen broken & touch unresponsive',
            estimatedCost: 14500, depositPaid: 2000, status: 'IN_REPAIR', createdAt: new Date().toISOString(),
          },
          {
            id: 'REP-1002', ticketNo: 'REP-2026-002', customerName: 'Kamran Shah', customerPhone: '03335551212',
            deviceModel: 'iPhone 13 Pro', imeiSerial: '354810293847561', problemDescription: 'Battery replacement (BH 72%)',
            estimatedCost: 12000, depositPaid: 5000, status: 'READY', createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        localStorage.setItem('repair_tickets', JSON.stringify(initial));
        setRepairs(initial);
      }
    } catch {
      message.error('Failed to load repair tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try { const res = await api.get('/customers'); setCustomers(res?.data?.data || res?.data || []); } catch {}
  };

  const fetchProducts = async () => {
    try { const res = await api.get('/products?limit=100'); setProducts(res?.data?.data || []); } catch {}
  };

  const handleCreateTicket = (values) => {
    setSubmitting(true);
    try {
      const ticketNo = `REP-2026-${String(repairs.length + 1).padStart(3, '0')}`;
      const newTicket = {
        id: `REP-${Date.now()}`,
        ticketNo,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deviceModel: values.deviceModel,
        imeiSerial: values.imeiSerial || 'N/A',
        problemDescription: values.problemDescription,
        estimatedCost: Number(values.estimatedCost || 0),
        depositPaid: Number(values.depositPaid || 0),
        status: 'RECEIVED',
        createdAt: new Date().toISOString(),
      };

      const updated = [newTicket, ...repairs];
      localStorage.setItem('repair_tickets', JSON.stringify(updated));
      setRepairs(updated);
      message.success(`Repair ticket ${ticketNo} created successfully!`);
      setCreateModalVisible(false);
      form.resetFields();
    } catch {
      message.error('Failed to create repair ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = (ticketId, nextStatus) => {
    const updated = repairs.map(r => r.id === ticketId ? { ...r, status: nextStatus } : r);
    localStorage.setItem('repair_tickets', JSON.stringify(updated));
    setRepairs(updated);
    message.success(`Ticket status updated to ${nextStatus}`);
  };

  const printClaimTag = (ticket) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 3mm; }
          body { font-family: monospace; font-size: 11px; width: 72mm; margin: 0 auto; text-align: center; }
          .title { font-size: 16px; font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .left { text-align: left; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="title">Hassan Traderz</div>
        <div>Mobile Repair Claim Tag</div>
        <div class="divider"></div>
        <div class="left"><b>Ticket #:</b> ${ticket.ticketNo}</div>
        <div class="left"><b>Date:</b> ${new Date(ticket.createdAt).toLocaleString()}</div>
        <div class="left"><b>Customer:</b> ${ticket.customerName} (${ticket.customerPhone})</div>
        <div class="left"><b>Device:</b> ${ticket.deviceModel}</div>
        <div class="left"><b>Problem:</b> ${ticket.problemDescription}</div>
        <div class="divider"></div>
        <div class="left"><b>Est. Cost:</b> ₨ ${ticket.estimatedCost.toLocaleString()}</div>
        <div class="left"><b>Deposit Paid:</b> ₨ ${ticket.depositPaid.toLocaleString()}</div>
        <div class="left bold"><b>Balance Due:</b> ₨ ${(ticket.estimatedCost - ticket.depositPaid).toLocaleString()}</div>
        <div class="divider"></div>
        <div>Please present this tag to claim your device.</div>
      </body>
      </html>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); };
  };

  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNo',
      key: 'ticket',
      // Explicit style guarantees high contrast green tag in BOTH light & dark modes
      render: v => (
        <span style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: 6,
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--primary)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          fontWeight: 800,
          fontFamily: 'monospace',
        }}>
          {v}
        </span>
      ),
    },
    { title: 'Customer', render: r => <div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.customerName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.customerPhone}</div></div> },
    { title: 'Device Model', dataIndex: 'deviceModel', key: 'model', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
    { title: 'Problem', dataIndex: 'problemDescription', key: 'prob', ellipsis: true },
    { title: 'Est. Cost', dataIndex: 'estimatedCost', key: 'cost', render: v => <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatCurrency(v)}</span> },
    { title: 'Deposit Paid', dataIndex: 'depositPaid', key: 'dep', render: v => <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(v)}</span> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v, r) => (
        <Select
          value={v}
          size="small"
          onChange={(next) => handleUpdateStatus(r.id, next)}
          style={{ width: 140 }}
        >
          <Option value="RECEIVED"><Tag color="blue">Received</Tag></Option>
          <Option value="IN_REPAIR"><Tag color="orange">In Repair</Tag></Option>
          <Option value="READY"><Tag color="green">Ready for Pickup</Tag></Option>
          <Option value="DELIVERED"><Tag color="default">Delivered</Tag></Option>
        </Select>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: r => (
        <Space>
          <Button size="small" icon={<PrinterOutlined />} onClick={() => printClaimTag(r)}>
            Print Claim Tag
          </Button>
        </Space>
      ),
    },
  ];

  const filteredRepairs = statusFilter ? repairs.filter(r => r.status === statusFilter) : repairs;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <ToolOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            Mobile Repair & Service Work Orders
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Issue job tickets, track technician status, print 80mm claim tags & auto-deduct spare parts
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          style={{ borderRadius: 8, fontWeight: 700 }}
        >
          New Repair Ticket
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <div className="kpi-card">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>Total Repair Jobs</div>
            <div style={{ color: 'var(--text)', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{repairs.length}</div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="kpi-card warning">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>Active In Repair</div>
            <div style={{ color: 'var(--warning)', fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              {repairs.filter(r => ['RECEIVED', 'IN_REPAIR'].includes(r.status)).length}
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div className="kpi-card success">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>Ready for Pickup</div>
            <div style={{ color: 'var(--success)', fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              {repairs.filter(r => r.status === 'READY').length}
            </div>
          </div>
        </Col>
      </Row>

      {/* Filter & Table */}
      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Select
          placeholder="Filter by Status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 220 }}
        >
          <Option value="RECEIVED">Received</Option>
          <Option value="IN_REPAIR">In Repair</Option>
          <Option value="READY">Ready for Pickup</Option>
          <Option value="DELIVERED">Delivered</Option>
        </Select>
      </Card>

      <Table
        dataSource={filteredRepairs}
        columns={columns}
        rowKey="id"
        loading={loading}
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
      />

      {/* CREATE REPAIR TICKET MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Create Mobile Repair Work Ticket</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Ali Raza" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerPhone" label="Customer Phone #" rules={[{ required: true }]}>
                <Input placeholder="03001234567" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="deviceModel" label="Mobile Device Model" rules={[{ required: true }]}>
                <Input placeholder="e.g. Samsung A54 5G / iPhone 13" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imeiSerial" label="IMEI / Serial Number">
                <Input placeholder="15-digit IMEI or Serial" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="problemDescription" label="Fault & Problem Description" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="e.g. Screen glass cracked, touch working, battery charging slow" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="estimatedCost" label="Estimated Cost (₨)" rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="depositPaid" label="Advance Deposit Paid (₨)">
                <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={0} defaultValue={0} />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ height: 46, fontWeight: 700 }}>
            Create Ticket & Issue Claim Tag
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
