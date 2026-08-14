// client/src/pages/tradein/TradeInPage.jsx — Used Mobile Buyback & Police Verification (Fixed Light Mode Contrast)
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Form,
  InputNumber, Typography, Row, Col, message, Divider, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, SwapOutlined, PrinterOutlined,
  CheckCircleOutlined, SafetyCertificateOutlined, IdcardOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Option } = Select;
const { Title, Text } = Typography;

export default function TradeInPage() {
  const { t } = useTranslation();

  const [tradeIns, setTradeIns]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form]                        = Form.useForm();
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    fetchTradeIns();
  }, []);

  const fetchTradeIns = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('tradein_records');
      if (stored) {
        setTradeIns(JSON.parse(stored));
      } else {
        const initial = [
          {
            id: 'TRD-1001', voucherNo: 'TRD-2026-001', customerName: 'Zubair Ahmad', customerCnic: '35202-1234567-1',
            customerPhone: '03214445566', deviceModel: 'iPhone 12 (128GB)', imei: '359102948102948',
            conditionGrade: 'Grade A', purchasePrice: 95000, targetResalePrice: 110000,
            status: 'IN_STOCK', date: new Date().toISOString(),
          },
        ];
        localStorage.setItem('tradein_records', JSON.stringify(initial));
        setTradeIns(initial);
      }
    } catch {
      message.error('Failed to load buyback records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTradeIn = (values) => {
    setSubmitting(true);
    try {
      const voucherNo = `TRD-2026-${String(tradeIns.length + 1).padStart(3, '0')}`;
      const record = {
        id: `TRD-${Date.now()}`,
        voucherNo,
        customerName: values.customerName,
        customerCnic: values.customerCnic,
        customerPhone: values.customerPhone,
        deviceModel: values.deviceModel,
        imei: values.imei,
        conditionGrade: values.conditionGrade,
        purchasePrice: Number(values.purchasePrice),
        targetResalePrice: Number(values.targetResalePrice),
        status: 'IN_STOCK',
        date: new Date().toISOString(),
      };

      const updated = [record, ...tradeIns];
      localStorage.setItem('tradein_records', JSON.stringify(updated));
      setTradeIns(updated);
      message.success(`Used Mobile Buyback ${voucherNo} recorded & added to stock!`);
      setModalVisible(false);
      form.resetFields();
    } catch {
      message.error('Failed to record buyback');
    } finally {
      setSubmitting(false);
    }
  };

  const printPoliceVerificationForm = (record) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: sans-serif; font-size: 13px; line-height: 1.6; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; }
          .subtitle { font-size: 14px; color: #444; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table td, .table th { border: 1px solid #000; padding: 8px; }
          .signature-box { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig-line { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">HASSAN TRADERZ — USED MOBILE BUYBACK VOUCHER</div>
          <div class="subtitle">Second-Hand Electronics Purchase & Police Verification Form</div>
        </div>

        <p><b>Voucher #:</b> ${record.voucherNo} | <b>Date:</b> ${new Date(record.date).toLocaleDateString()}</p>

        <h3>1. SELLER / CUSTOMER IDENTIFICATION</h3>
        <table class="table">
          <tr><td><b>Full Name:</b> ${record.customerName}</td><td><b>CNIC #:</b> ${record.customerCnic}</td></tr>
          <tr><td><b>Phone #:</b> ${record.customerPhone}</td><td><b>Verification:</b> Verified original CNIC</td></tr>
        </table>

        <h3>2. MOBILE DEVICE SPECIFICATIONS</h3>
        <table class="table">
          <tr><td><b>Device Model:</b> ${record.deviceModel}</td><td><b>IMEI / Serial #:</b> ${record.imei}</td></tr>
          <tr><td><b>Condition Grade:</b> ${record.conditionGrade}</td><td><b>Purchase Amount:</b> ₨ ${record.purchasePrice.toLocaleString()}</td></tr>
        </table>

        <p style="margin-top: 20px;"><b>Seller Declaration:</b> I hereby declare that I am the legitimate owner of the above-mentioned mobile phone and it is not stolen, blocked, or involved in any unlawful activity. I transfer full ownership to Hassan Traderz.</p>

        <div class="signature-box">
          <div class="sig-line">Seller Signature & Thumb Impression</div>
          <div class="sig-line">Shop Stamp & Buyer Signature</div>
        </div>
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
    { title: 'Voucher #', dataIndex: 'voucherNo', key: 'vNo', render: v => <Tag color="cyan" style={{ fontWeight: 800 }}>{v}</Tag> },
    { title: 'Seller Name', dataIndex: 'customerName', key: 'seller', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Seller CNIC', dataIndex: 'customerCnic', key: 'cnic', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Device Model', dataIndex: 'deviceModel', key: 'model', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
    { title: 'IMEI', dataIndex: 'imei', key: 'imei', render: v => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: 'Purchase Price', dataIndex: 'purchasePrice', key: 'pp', render: v => <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(v)}</span> },
    { title: 'Target Resale', dataIndex: 'targetResalePrice', key: 'rp', render: v => <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(v)}</span> },
    {
      title: 'Actions',
      key: 'actions',
      render: r => (
        <Button size="small" icon={<PrinterOutlined />} onClick={() => printPoliceVerificationForm(r)}>
          Police Voucher PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <SwapOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            Used Mobile Phone Buyback & Trade-In
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Buy second-hand phones, record CNIC verification, IMEI tracking & auto-add to pre-owned inventory
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          style={{ borderRadius: 8, fontWeight: 700 }}
        >
          Record Used Buyback
        </Button>
      </div>

      {/* KPI Cards — Fixed Light Mode Text Contrast */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <div className="kpi-card">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>Total Buyback Purchases</div>
            <div style={{ color: 'var(--text)', fontSize: 28, fontWeight: 800, marginTop: 4 }}>{tradeIns.length}</div>
          </div>
        </Col>
        <Col xs={24} sm={12}>
          <div className="kpi-card success">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>Total Investment (Buyback Cost)</div>
            <div style={{ color: 'var(--success)', fontSize: 28, fontWeight: 800, marginTop: 4 }}>
              {formatCurrency(tradeIns.reduce((s, t) => s + t.purchasePrice, 0))}
            </div>
          </div>
        </Col>
      </Row>

      <Table
        dataSource={tradeIns}
        columns={columns}
        rowKey="id"
        loading={loading}
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
      />

      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Used Mobile Buyback & Police Verification Form</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={650}
      >
        <Alert
          type="warning"
          showIcon
          message="Legal CNIC Verification Required"
          description="Ensure customer presents original Pakistani CNIC and enters valid 15-digit IMEI number."
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={handleCreateTradeIn}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="customerName" label="Seller Full Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Zubair Ahmad" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerCnic" label="Seller CNIC #" rules={[{ required: true }]}>
                <Input placeholder="35202-1234567-1" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="customerPhone" label="Seller Phone #" rules={[{ required: true }]}>
                <Input placeholder="03001234567" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceModel" label="Mobile Device Model" rules={[{ required: true }]}>
                <Input placeholder="e.g. iPhone 12 / Samsung S21" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="imei" label="15-Digit IMEI / Serial #" rules={[{ required: true }]}>
                <Input placeholder="359102948102948" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="conditionGrade" label="Condition Grade" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="Grade A">Grade A (Like New / Mint)</Option>
                  <Option value="Grade B">Grade B (Minor Scratches)</Option>
                  <Option value="Grade C">Grade C (Heavy Usage / Refurbished)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="purchasePrice" label="Buyback Purchase Cost (₨)" rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetResalePrice" label="Target Resale Price (₨)" rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ height: 46, fontWeight: 700 }}>
            Save Buyback Record & Generate Police Voucher
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
