// client/src/pages/khata/KhataPage.jsx — Responsive Customer Khata Ledger & Installments
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Form,
  InputNumber, Typography, Row, Col, message, Divider, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, BookOutlined, PrinterOutlined,
  DollarOutlined, PhoneOutlined, FilePdfOutlined, UserOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Option } = Select;
const { Title, Text } = Typography;

export default function KhataPage() {
  const { t, i18n } = useTranslation();

  const [customers, setCustomers]   = useState([]);
  const [selectedCust, setSelectedCust] = useState(null);
  const [khataEntries, setKhataEntries] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [form]                      = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCustomers(list);
      if (list.length > 0 && !selectedCust) {
        handleSelectCustomer(list[0]);
      }
    } catch {
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCust(cust);
    const stored = localStorage.getItem(`khata_${cust.id}`);
    if (stored) {
      setKhataEntries(JSON.parse(stored));
    } else {
      const initial = [
        { id: '1', date: new Date(Date.now() - 86400000 * 3).toISOString(), description: 'Mobile Purchase (Partial Credit)', type: 'DEBIT', amount: 35000, balance: 35000 },
        { id: '2', date: new Date(Date.now() - 86400000 * 1).toISOString(), description: 'Installment Payment Received (Cash)', type: 'CREDIT', amount: 10000, balance: 25000 },
      ];
      localStorage.setItem(`khata_${cust.id}`, JSON.stringify(initial));
      setKhataEntries(initial);
    }
  };

  const handleRecordPayment = (values) => {
    if (!selectedCust) return;
    setSubmitting(true);
    try {
      const currentBal = khataEntries.length > 0 ? khataEntries[khataEntries.length - 1].balance : 0;
      const isCredit = values.type === 'CREDIT';
      const amount = Number(values.amount);
      const newBal = isCredit ? currentBal - amount : currentBal + amount;

      const entry = {
        id: String(Date.now()),
        date: new Date().toISOString(),
        description: values.description,
        type: values.type,
        amount,
        balance: Math.max(0, newBal),
      };

      const updated = [...khataEntries, entry];
      localStorage.setItem(`khata_${selectedCust.id}`, JSON.stringify(updated));
      setKhataEntries(updated);
      message.success('Khata transaction recorded!');
      setPaymentModalVisible(false);
      form.resetFields();
    } catch {
      message.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const printKhataStatement = () => {
    if (!selectedCust) return;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: sans-serif; font-size: 13px; color: #000; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          .table td, .table th { border: 1px solid #000; padding: 8px; text-align: left; }
          .table th { background: #f1f5f9; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">HASSAN TRADERZ — CUSTOMER KHATA STATEMENT</div>
          <div>حسن ٹریڈرز - گاہک کھاتہ سٹیٹمنٹ</div>
        </div>

        <div><b>Customer Name:</b> ${selectedCust.name}</div>
        <div><b>Phone #:</b> ${selectedCust.phone || 'N/A'}</div>
        <div><b>Statement Date:</b> ${new Date().toLocaleDateString()}</div>

        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th class="right">Amount</th>
              <th class="right">Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            ${khataEntries.map(e => `
              <tr>
                <td>${new Date(e.date).toLocaleDateString()}</td>
                <td>${e.description}</td>
                <td>${e.type === 'DEBIT' ? 'Debit / Udhar (ادھار)' : 'Credit / Received (وصولی)'}</td>
                <td class="right">₨ ${Number(e.amount).toLocaleString()}</td>
                <td class="right" style="font-weight:bold;">₨ ${Number(e.balance).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:100%;height:0;border:0;';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); };
  };

  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: v => <span style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDateTime(v)}</span>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'desc',
      minWidth: 180,
      render: v => <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: v => <Tag color={v === 'DEBIT' ? 'red' : 'green'} style={{ fontWeight: 700 }}>{v === 'DEBIT' ? 'Debit (ادھار)' : 'Credit (وصولی)'}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amt',
      width: 130,
      render: v => <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatCurrency(v)}</span>
    },
    {
      title: 'Remaining Balance',
      dataIndex: 'balance',
      key: 'bal',
      width: 150,
      render: v => <span style={{ fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{formatCurrency(v)}</span>
    },
  ];

  return (
    <div className="fade-in">
      {/* Responsive Page Header */}
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800, lineHeight: 1.2 }}>
            <BookOutlined style={{ color: 'var(--primary)', marginRight: 8 }} />
            Customer Khata (گاہک کھاتہ)
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Track customer debit/credit ledgers, payment installments & print Khata statements
          </Text>
        </div>

        <Space wrap style={{ marginTop: 4 }}>
          <Button
            icon={<FilePdfOutlined />}
            onClick={printKhataStatement}
            disabled={!selectedCust}
            style={{ fontWeight: 600, borderRadius: 8 }}
          >
            Print Statement
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setPaymentModalVisible(true)}
            disabled={!selectedCust}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Record Khata Entry
          </Button>
        </Space>
      </div>

      <Row gutter={[14, 14]}>
        {/* Left Customer Selector & Khata Balance Card */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: 'var(--primary)' }} />
                <span>Select Customer</span>
              </Space>
            }
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}
            bodyStyle={{ padding: 14 }}
          >
            <Select
              showSearch
              placeholder="Search customer by name or phone..."
              optionFilterProp="children"
              value={selectedCust?.id}
              onChange={(val) => handleSelectCustomer(customers.find(c => c.id === val))}
              style={{ width: '100%', marginBottom: 14 }}
              size="large"
            >
              {customers.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</Option>)}
            </Select>

            {selectedCust ? (
              <div style={{ background: 'var(--bg-elevated)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{selectedCust.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, marginBottom: 10 }}>
                  <PhoneOutlined /> {selectedCust.phone || 'No phone recorded'}
                </div>
                <Divider style={{ margin: '10px 0', borderColor: 'var(--border)' }} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Current Remaining Balance:</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--danger)', marginTop: 2 }}>
                  {formatCurrency(khataEntries.length > 0 ? khataEntries[khataEntries.length - 1].balance : 0)}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                Please select a customer to view ledger
              </div>
            )}
          </Card>
        </Col>

        {/* Right Ledger Table */}
        <Col xs={24} lg={16}>
          <Card
            title={<span>Khata Ledger History — <b>{selectedCust?.name || 'No Customer Selected'}</b></span>}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={khataEntries}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10, responsive: true }}
              scroll={{ x: 'max-content' }}
              style={{ borderRadius: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* RECORD KHATA ENTRY MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800 }}>Record Khata Transaction — {selectedCust?.name}</span>}
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleRecordPayment}>
          <Form.Item name="type" label="Transaction Type (قسم)" rules={[{ required: true, message: 'Please select type' }]} initialValue="CREDIT">
            <Select size="large">
              <Option value="CREDIT">💰 Payment Received / Installment (وصولی)</Option>
              <Option value="DEBIT">📖 Udhar / Added Credit (ادھار)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Amount (رقم ₨)" rules={[{ required: true, message: 'Amount is required' }]}>
            <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={1} placeholder="Enter transaction amount" />
          </Form.Item>

          <Form.Item name="description" label="Notes / Description (تفصیل)" rules={[{ required: true, message: 'Description is required' }]}>
            <Input placeholder="e.g. Monthly installment received in Cash / EasyPaisa" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ height: 46, fontWeight: 700, marginTop: 8 }}>
            Save Khata Transaction
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
