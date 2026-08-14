// client/src/pages/sales/SaleDetailPage.jsx — Detailed Sale View & PDF Invoice
import { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Divider, Typography, Row, Col, Spin, Space } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../../utils/formatters';
import { printReceiptHTML } from '../../utils/thermalPrint';

const { Title } = Typography;

export default function SaleDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { t, i18n }  = useTranslation();

  const [sale, setSale]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sales/${id}`)
      .then(res => setSale(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spin size="large" /></div>;
  if (!sale) return <div>Sale not found</div>;

  const itemColumns = [
    { title: 'Product', dataIndex: ['product', 'nameEn'], key: 'name' },
    { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku', render: v => <Tag>{v}</Tag> },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: v => formatCurrency(v) },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Discount %', dataIndex: 'discountPct', key: 'discountPct', render: v => `${v}%` },
    { title: 'GST Amount', dataIndex: 'gstAmount', key: 'gstAmount', render: v => formatCurrency(v) },
    { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', render: v => <span style={{ fontWeight: 700 }}>{formatCurrency(v)}</span> },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales')} />
          <Title level={3} style={{ color: 'var(--text)', margin: 0 }}>Invoice {sale.invoiceNumber}</Title>
          <Tag color={sale.status === 'COMPLETED' ? 'green' : 'red'}>{sale.status}</Tag>
        </Space>
        <Space>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              const settings = { shop_name: 'Mobile World', shop_address: 'Main Bazaar, Lahore', shop_phone: '+92-300-0000000', gst_rate: 17 };
              printReceiptHTML(sale, settings, i18n.language);
            }}
          >
            Print Thermal Receipt
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Line Items" style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            <Table
              dataSource={sale.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Sale Information" style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: 12 }}><b>Date:</b> {formatDateTime(sale.saleDate)}</div>
            <div style={{ marginBottom: 12 }}><b>Cashier:</b> {sale.user?.fullName}</div>
            <div style={{ marginBottom: 12 }}><b>Customer:</b> {sale.customer?.name || 'Walk-in Customer'}</div>
            <div style={{ marginBottom: 12 }}><b>Payment Method:</b> <Tag color="blue">{getPaymentMethodLabel(sale.paymentMethod)}</Tag></div>
            {sale.paymentRef && <div style={{ marginBottom: 12 }}><b>Txn Ref:</b> {sale.paymentRef}</div>}

            <Divider style={{ borderColor: 'var(--border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>Subtotal:</span><span>{formatCurrency(sale.subtotal)}</span></div>
            {Number(sale.discountAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--warning)' }}><span>Discount:</span><span>- {formatCurrency(sale.discountAmount)}</span></div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>GST (17%):</span><span>{formatCurrency(sale.gstAmount)}</span></div>
            <Divider style={{ margin: '8px 0', borderColor: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--success)' }}><span>TOTAL:</span><span>{formatCurrency(sale.totalAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>Paid Amount:</span><span>{formatCurrency(sale.paidAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>Change:</span><span>{formatCurrency(sale.changeAmount)}</span></div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
