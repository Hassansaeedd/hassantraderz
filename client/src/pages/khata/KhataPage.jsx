// client/src/pages/khata/KhataPage.jsx — Customer Khata Ledger & Installments
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Form,
  InputNumber, Typography, Row, Col, message, Divider, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, BookOutlined, PrinterOutlined,
  DollarOutlined, PhoneOutlined, FilePdfOutlined
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
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: sans-serif; font-size: 13px; color: #000; }
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
                <td>${e.type === 'DEBIT' ? 'Udhar (دیعہ)' : 'Payment Received (وصولی)'}</td>
                <td class="right">₨ ${e.amount.toLocaleString()}</td>
                <td class="right" style="font-weight:bold;">₨ ${e.balance.toLocaleString()}</td>
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
    { title: 'Date', dataIndex: 'date', key: 'date', render: v => formatDateTime(v) },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: v => <Tag color={v === 'DEBIT' ? 'red' : 'green'}>{v === 'DEBIT' ? 'Debit (ادھار)' : 'Credit (وصولی)'}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amt', render: v => <span style={{ fontWeight: 700 }}>{formatCurrency(v)}</span> },
    { title: 'Remaining Balance', dataIndex: 'balance', key: 'bal', render: v => <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(v)}</span> },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <BookOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            Customer Khata & Credit Accounts (گاہک کھاتہ)
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Track customer debit/credit ledgers, partial payment installments & print Khata statements
          </Text>
        </div>

        <Space>
          <Button icon={<FilePdfOutlined />} onClick={printKhataStatement} disabled={!selectedCust}>
            Print Khata Statement PDF
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setPaymentModalVisible(true)}
            disabled={!selectedCust}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Record Khata Entry
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Select Customer Account" style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            <Select
              showSearch
              placeholder="Search customer by name..."
              value={selectedCust?.id}
              onChange={(val) => handleSelectCustomer(customers.find(c => c.id === val))}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {customers.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</Option>)}
            </Select>

            {selectedCust && (
              <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{selectedCust.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}><PhoneOutlined /> {selectedCust.phone || 'N/A'}</div>
                <Divider style={{ margin: '8px 0', borderColor: 'var(--border)' }} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Khata Balance:</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>
                  {formatCurrency(khataEntries.length > 0 ? khataEntries[khataEntries.length - 1].balance : 0)}
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title={`Khata Ledger History — ${selectedCust?.name || ''}`} style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            <Table
              dataSource={khataEntries}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
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
      >
        <Form form={form} layout="vertical" onFinish={handleRecordPayment}>
          <Form.Item name="type" label="Transaction Type" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="CREDIT">Payment Received / Installment (وصولی)</Option>
              <Option value="DEBIT">Udhar / Added Credit (ادھار)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Amount (₨)" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={1} />
          </Form.Item>

          <Form.Item name="description" label="Notes / Description" rules={[{ required: true }]}>
            <Input placeholder="e.g. Monthly installment paid via EasyPaisa" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ height: 44, fontWeight: 700 }}>
            Save Khata Transaction
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
