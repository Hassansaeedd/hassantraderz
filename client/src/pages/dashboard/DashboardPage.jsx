// client/src/pages/dashboard/DashboardPage.jsx (Fixed Light Mode Contrast)
import { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Spin, Typography } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Title } = Typography;

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(res => setData(res.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
    const timer = setInterval(() => {
      api.get('/reports/dashboard').then(res => setData(res.data || res)).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spin size="large" /></div>;

  const kpis = [
    { key: 'revenue',      label: t('dashboard.todayRevenue'),      value: formatCurrency(data?.today?.revenue),      color: '#10b981', class: '' },
    { key: 'transactions', label: t('dashboard.todayTransactions'), value: data?.today?.transactions || 0,            color: '#06b6d4', class: 'success' },
    { key: 'gst',          label: t('dashboard.todayGST'),          value: formatCurrency(data?.today?.gst),          color: '#f59e0b', class: 'warning' },
    { key: 'month',        label: t('dashboard.monthRevenue'),      value: formatCurrency(data?.thisMonth?.revenue),  color: '#8b5cf6', class: '' },
  ];

  return (
    <div className="fade-in">
      <Title level={3} style={{ color: 'var(--text)', marginBottom: 24, fontWeight: 800 }}>{t('nav.dashboard')}</Title>

      {/* KPI Cards — Fixed Light Mode Text Contrast */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {kpis.map(kpi => (
          <Col xs={24} sm={12} xl={6} key={kpi.key}>
            <div className={`kpi-card ${kpi.class}`} style={{ '--accent': kpi.color }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</div>
              <div style={{ color: 'var(--text)', fontSize: 28, fontWeight: 800, marginTop: 8 }}>{kpi.value}</div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Revenue Chart */}
        <Col xs={24} xl={16}>
          <Card title={<span style={{ color: 'var(--text)', fontWeight: 700 }}>{t('dashboard.revenueChart')}</span>}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.revenueChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={v => `₨${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="gst"     stroke="#f59e0b" strokeWidth={2} dot={false} name="GST" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Low Stock */}
        <Col xs={24} xl={8}>
          <Card title={<span style={{ color: 'var(--danger)', fontWeight: 700 }}><WarningOutlined /> {t('dashboard.lowStock')}</span>}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            {(data?.lowStock || []).length === 0
              ? <div style={{ color: 'var(--success)', textAlign: 'center', padding: 24, fontWeight: 600 }}>✓ All products well-stocked</div>
              : (data?.lowStock || []).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{p.nameEn}</span>
                    <Tag color={p.currentStock === 0 ? 'red' : 'orange'}>{p.currentStock} left</Tag>
                  </div>
                ))
            }
          </Card>
        </Col>

        {/* Top Products */}
        <Col xs={24} xl={12}>
          <Card title={<span style={{ color: 'var(--text)', fontWeight: 700 }}>{t('dashboard.topProducts')}</span>}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={(data?.topProducts || []).map(p => ({ name: p.product?.nameEn, revenue: Number(p._sum?.totalAmount || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={v => `₨${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Recent Sales */}
        <Col xs={24} xl={12}>
          <Card title={<span style={{ color: 'var(--text)', fontWeight: 700 }}>{t('dashboard.recentSales')}</span>}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)' }}>
            <Table
              dataSource={data?.recentSales || []}
              rowKey="id" size="small" pagination={false}
              columns={[
                { title: 'Invoice', dataIndex: 'invoiceNumber', render: v => <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>{v}</span> },
                { title: 'Customer', render: r => r.customer?.name || 'Walk-in', responsive: ['md'] },
                { title: 'Total', dataIndex: 'totalAmount', render: v => formatCurrency(v) },
                { title: 'Time', dataIndex: 'saleDate', render: v => formatDateTime(v), responsive: ['lg'] },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
