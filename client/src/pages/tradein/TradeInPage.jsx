// client/src/pages/tradein/TradeInPage.jsx — Used Mobile Buyback & Police Verification with Database Persistence
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Form,
  InputNumber, Typography, Row, Col, message, Divider, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, SwapOutlined, PrinterOutlined,
  CheckCircleOutlined, SafetyCertificateOutlined, IdcardOutlined, ReloadOutlined
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
  const [search, setSearch]           = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form]                        = Form.useForm();
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    fetchTradeIns();
  }, []);

  const fetchTradeIns = async (q = search) => {
    setLoading(true);
    try {
      let url = '/trade-ins';
      if (q) url += `?search=${encodeURIComponent(q)}`;
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || res || []);
      setTradeIns(data);
    } catch {
      const stored = localStorage.getItem('tradein_records');
      if (stored) setTradeIns(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTradeIn = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        sellerName: values.customerName || values.sellerName,
        sellerPhone: values.customerPhone || values.sellerPhone,
        sellerCnic: values.customerCnic || values.sellerCnic,
        sellerAddress: values.sellerAddress || null,
        brand: values.brand || 'Apple/Samsung',
        modelName: values.deviceModel || values.modelName,
        imei1: values.imei || values.imei1,
        conditionGrade: values.conditionGrade || 'GRADE_A',
        purchasePrice: Number(values.purchasePrice),
        paymentMethod: 'CASH',
        hasBox: true,
        hasCharger: true,
        hasOriginalCnicCopy: true,
      };

      const res = await api.post('/trade-ins', payload);
      const newRecord = res.data?.data || res.data || res;

      message.success(`Trade-in voucher ${newRecord.voucherNo || 'created'} saved to database!`);
      setModalVisible(false);
      form.resetFields();
      fetchTradeIns();
    } catch (err) {
      message.error(err?.message || 'Failed to record buyback');
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
          .sign-box { margin-top: 50px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">HASSAN TRADERZ — USED MOBILE BUYBACK AGREEMENT</div>
          <div class="subtitle">Police Verification & Seller Ownership Declaration (فروخت کنندہ کا بیان حلفی)</div>
        </div>

        <table class="table">
          <tr><th colspan="2" style="background:#f1f5f9; text-align:left;">1. SELLER / CUSTOMER DETAILS (فروخت کنندہ کی تفصیلات)</th></tr>
          <tr><td width="35%"><b>Full Name (نام):</b></td><td>${record.sellerName || record.customerName}</td></tr>
          <tr><td><b>CNIC Number (شناختی کارڈ نمبر):</b></td><td><b>${record.sellerCnic || record.customerCnic}</b> (Copy Attached)</td></tr>
          <tr><td><b>Mobile Phone (فون نمبر):</b></td><td>${record.sellerPhone || record.customerPhone}</td></tr>
        </table>

        <table class="table">
          <tr><th colspan="2" style="background:#f1f5f9; text-align:left;">2. DEVICE IDENTIFICATION (موبائل فون کی تفصیلات)</th></tr>
          <tr><td width="35%"><b>Brand & Model (ماڈل):</b></td><td><b>${record.modelName || record.deviceModel}</b></td></tr>
          <tr><td><b>15-Digit IMEI:</b></td><td><b style="font-family:monospace; font-size:14px;">${record.imei1 || record.imei}</b></td></tr>
          <tr><td><b>Condition Grade:</b></td><td>${record.conditionGrade}</td></tr>
          <tr><td><b>Purchase Price Paid (خریداری قیمت):</b></td><td><b>₨ ${Number(record.purchasePrice).toLocaleString()}</b> (Cash Paid)</td></tr>
        </table>

        <div style="margin: 20px 0; padding: 12px; border: 1px solid #000; background: #fff;">
          <b>LEGAL DECLARATION / بیان حلفی:</b><br/>
          I, <b>${record.sellerName || record.customerName}</b>, holding CNIC <b>${record.sellerCnic || record.customerCnic}</b>, hereby declare that I am the sole legal owner of this device. It is not stolen, snatched, or involved in any illegal activity. I take full legal responsibility before Law Enforcement Agencies (Police / FIA).
        </div>

        <div class="sign-box">
          <div>_______________________<br/><b>Seller Signature & Thumb</b><br/>(فروخت کنندہ کے دستخط اور انگوٹھا)</div>
          <div>_______________________<br/><b>Shopkeeper Signature & Stamp</b><br/>(حسن ٹریڈرز مہر اور دستخط)</div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const columns = [
    {
      title: 'Voucher #',
      dataIndex: 'voucherNo',
      key: 'voucherNo',
      render: (v) => <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'Seller & CNIC',
      key: 'seller',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.sellerName || r.customerName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CNIC: {r.sellerCnic || r.customerCnic}</div>
        </div>
      ),
    },
    {
      title: 'Device & IMEI',
      key: 'device',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700 }}>{r.modelName || r.deviceModel}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>IMEI: {r.imei1 || r.imei}</div>
        </div>
      ),
    },
    {
      title: 'Condition',
      dataIndex: 'conditionGrade',
      key: 'conditionGrade',
      render: (g) => <Tag color="blue">{g}</Tag>,
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      render: (v) => <span style={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Police Voucher',
      key: 'action',
      render: (_, r) => (
        <Button
          icon={<PrinterOutlined />}
          size="small"
          onClick={() => printPoliceVerificationForm(r)}
        >
          Police Voucher (A4)
        </Button>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
            Used Mobile Buyback & Police Verification (استعمال شدہ موبائل خرید و فروخت)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Customer CNIC logging, 15-digit IMEI verification, condition grading, and legal police declarations
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setModalVisible(true)}
          style={{ fontWeight: 700 }}
        >
          Record Used Phone Buyback
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={12}>
          <Col xs={24} md={16}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Search by Voucher #, Seller Name, CNIC, IMEI, Model..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                fetchTradeIns(e.target.value);
              }}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Button icon={<ReloadOutlined />} onClick={() => fetchTradeIns()} block>
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={tradeIns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* CREATE TRADE IN MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800 }}>Record Used Phone Buyback</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={620}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTradeIn}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sellerName" label="Seller Name (فروخت کنندہ)" rules={[{ required: true }]}>
                <Input placeholder="e.g. Zubair Ahmad" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sellerCnic" label="CNIC Number (شناختی کارڈ)" rules={[{ required: true }]}>
                <Input placeholder="e.g. 35202-1234567-1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sellerPhone" label="Phone Number" rules={[{ required: true }]}>
                <Input placeholder="e.g. 03214445566" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="Phone Brand" rules={[{ required: true }]}>
                <Select placeholder="Select Brand">
                  <Option value="Apple">Apple iPhone</Option>
                  <Option value="Samsung">Samsung</Option>
                  <Option value="Xiaomi">Xiaomi / Redmi</Option>
                  <Option value="Vivo">Vivo</Option>
                  <Option value="Oppo">Oppo</Option>
                  <Option value="Infinix">Infinix / Tecno</Option>
                  <Option value="Other">Other Brand</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="modelName" label="Model & Storage" rules={[{ required: true }]}>
                <Input placeholder="e.g. iPhone 13 Pro 128GB" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imei1" label="15-Digit Primary IMEI" rules={[{ required: true }]}>
                <Input placeholder="e.g. 359102948102948" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="conditionGrade" label="Physical Condition" rules={[{ required: true }]}>
                <Select defaultValue="GRADE_A">
                  <Option value="GRADE_A">Grade A (Pristine / Like New 10/10)</Option>
                  <Option value="GRADE_B">Grade B (Minor Scratches 9/10)</Option>
                  <Option value="GRADE_C">Grade C (Heavy Usage / Dents 7/10)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchasePrice" label="Cash Purchase Price (₨)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="e.g. 95000" />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ fontWeight: 700, marginTop: 10 }}>
            Save Buyback & Generate Police Voucher
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
