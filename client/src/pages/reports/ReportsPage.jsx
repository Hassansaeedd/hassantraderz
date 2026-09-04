// client/src/pages/reports/ReportsPage.jsx — Analytics, Financial & GST Reports
import { useState, useEffect } from 'react';
import {
  Card, Tabs, DatePicker, Button, Table, Typography, Row, Col, Statistic, Space, Tag
} from 'antd';
import { DownloadOutlined, PrinterOutlined, BarChartOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { RangePicker } = DatePicker;
const { Title }       = Typography;

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sales');

  // Report Data
  const [salesReport, setSalesReport]         = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [loading, setLoading]                 = useState(false);

  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    if (activeTab === 'inventory') fetchInventoryReport();
  }, [activeTab]);

  const fetchSalesReport = async (from = null, to = null) => {
    setLoading(true);
    try {
      let url = '/reports/sales';
      if (from && to) url += `?from=${from.toISOString()}&to=${to.toISOString()}`;
      const res = await api.get(url);
      setSalesReport(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/inventory');
      setInventoryReport(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const salesColumns = [
    { title: 'Invoice', dataIndex: 'invoiceNumber', key: 'invoiceNumber', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
    { title: 'Date', dataIndex: 'saleDate', key: 'date', render: v => formatDateTime(v) },
    { title: 'Customer', key: 'customer', render: r => r.customer?.name || 'Walk-in' },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: v => formatCurrency(v) },
    { title: 'GST (17%)', dataIndex: 'gstAmount', key: 'gst', render: v => formatCurrency(v) },
    { title: 'Total', dataIndex: 'totalAmount', key: 'total', render: v => <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(v)}</span> },
  ];

  const inventoryColumns = [
    { title: 'Product', dataIndex: 'nameEn', key: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Category', key: 'category', render: r => r.category?.nameEn || '-' },
    { title: 'Purchase Price', dataIndex: 'purchasePrice', key: 'pp', render: v => formatCurrency(v) },
    { title: 'Selling Price', dataIndex: 'sellingPrice', key: 'sp', render: v => formatCurrency(v) },
    { title: 'Stock', dataIndex: 'currentStock', key: 'stock', render: (v, r) => <Tag color={v <= r.minStockLevel ? 'orange' : 'green'}>{v}</Tag> },
    { title: 'Total Stock Valuation (Cost)', dataIndex: 'stockValue', key: 'val', render: v => <span style={{ fontWeight: 700 }}>{formatCurrency(v)}</span> },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ color: 'var(--text)', margin: 0 }}>{t('reports.title')}</Title>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'sales',
            label: <span><BarChartOutlined /> Sales & GST Report</span>,
            children: (
              <div>
                <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
                  <Row gutter={16} align="middle">
                    <Col span={12}>
                      <RangePicker style={{ width: '100%' }} onChange={(dates) => dates && fetchSalesReport(dates[0], dates[1])} />
                    </Col>
                  </Row>
                </Card>

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={8}>
                    <Card style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <Statistic title="Total Sales Revenue" value={formatCurrency(salesReport?.summary?.revenue || 0)} valueStyle={{ color: 'var(--success)' }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <Statistic title="Total GST Collected" value={formatCurrency(salesReport?.summary?.gst || 0)} valueStyle={{ color: 'var(--warning)' }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <Statistic title="Total Transactions" value={salesReport?.summary?.count || 0} />
                    </Card>
                  </Col>
                </Row>

                <Table
                  dataSource={salesReport?.sales || []}
                  columns={salesColumns}
                  rowKey="id"
                  loading={loading}
                  scroll={{ x: 'max-content' }}
                  style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
              </div>
            ),
          },
          {
            key: 'inventory',
            label: <span>📦 Inventory Valuation Report</span>,
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12}>
                    <Card style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <Statistic title="Total Inventory Stock Value (At Purchase Cost)" value={formatCurrency(inventoryReport?.summary?.totalStockValue || 0)} valueStyle={{ color: 'var(--primary)' }} />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                      <Statistic title="Total Potential Retail Value" value={formatCurrency(inventoryReport?.summary?.totalRetailValue || 0)} valueStyle={{ color: 'var(--success)' }} />
                    </Card>
                  </Col>
                </Row>

                <Table
                  dataSource={inventoryReport?.products || []}
                  columns={inventoryColumns}
                  rowKey="id"
                  loading={loading}
                  scroll={{ x: 'max-content' }}
                  style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
