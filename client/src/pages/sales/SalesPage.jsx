// client/src/pages/sales/SalesPage.jsx — Sales History & Returns (Fixed Data Mapping)
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, DatePicker,
  Typography, Row, Col, Modal, Form, InputNumber, message
} from 'antd';
import {
  EyeOutlined, SearchOutlined, ReloadOutlined,
  PrinterOutlined, RollbackOutlined, ShoppingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from '../../utils/formatters';
import { printReceiptHTML } from '../../utils/thermalPrint';

const { Option }     = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function SalesPage() {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();

  const [sales, setSales]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [status, setStatus]         = useState(null);
  const [dateRange, setDateRange]   = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Return Modal State
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedSale, setSelectedSale]             = useState(null);
  const [returnItems, setReturnItems]               = useState([]);
  const [returnReason, setReturnReason]             = useState('');
  const [submittingReturn, setSubmittingReturn]     = useState(false);

  useEffect(() => {
    fetchSales(1, 15);
  }, []);

  const fetchSales = async (page = 1, limit = 15) => {
    setLoading(true);
    try {
      let url = `/sales?page=${page}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      if (dateRange && dateRange[0]) url += `&from=${dateRange[0].toISOString()}&to=${dateRange[1].toISOString()}`;

      const res = await api.get(url);
      
      // Robust property extraction handling Axios unwrapped responses
      const salesList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const meta = res.pagination || res.data?.pagination || {};

      setSales(salesList);
      setPagination({
        current: meta.page || page,
        pageSize: meta.limit || limit,
        total: meta.total || salesList.length,
      });
    } catch (err) {
      message.error('Failed to load sales transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReturnModal = async (saleRecord) => {
    try {
      const res = await api.get(`/sales/${saleRecord.id}`);
      const saleData = res.data || res;
      setSelectedSale(saleData);
      setReturnItems(saleData.items.map(i => ({
        saleItemId: i.id,
        name: i.product?.nameEn || i.nameEn,
        maxQty: i.quantity - (i.returnedQty || 0),
        returnQty: 0
      })));
      setReturnReason('');
      setReturnModalVisible(true);
    } catch (err) {
      message.error('Failed to load sale details');
    }
  };

  const handleProcessReturn = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      message.warning('Please select at least one item quantity to return');
      return;
    }
    if (!returnReason.trim()) {
      message.warning('Please enter return reason');
      return;
    }

    setSubmittingReturn(true);
    try {
      await api.post(`/sales/${selectedSale.id}/return`, {
        items: itemsToReturn.map(i => ({ saleItemId: i.saleItemId, quantity: i.returnQty })),
        reason: returnReason,
        refundMethod: selectedSale.paymentMethod,
      });
      message.success('Return processed successfully! Inventory stock restored.');
      setReturnModalVisible(false);
      fetchSales(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err?.message || 'Return failed');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const columns = [
    {
      title: t('sales.invoice'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v, r) => <a onClick={() => navigate(`/sales/${r.id}`)} style={{ fontWeight: 700, color: 'var(--primary)' }}>{v}</a>,
    },
    {
      title: t('sales.customer'),
      key: 'customer',
      render: (r) => r.customer?.name || <Tag>Walk-in Customer</Tag>,
    },
    {
      title: t('sales.cashier'),
      key: 'cashier',
      render: (r) => r.user?.fullName || '-',
    },
    {
      title: t('sales.date'),
      dataIndex: 'saleDate',
      key: 'saleDate',
      render: (v) => formatDateTime(v),
    },
    {
      title: t('sales.payment'),
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (v) => <Tag color="blue">{getPaymentMethodLabel(v)}</Tag>,
    },
    {
      title: t('sales.amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(v)}</span>,
    },
    {
      title: t('sales.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={v === 'COMPLETED' ? 'green' : v === 'RETURNED' ? 'red' : 'orange'} style={{ borderRadius: 12, fontWeight: 600 }}>
          {v}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/sales/${r.id}`)} />
          <Button size="small" icon={<PrinterOutlined />} onClick={async () => {
            const res = await api.get(`/sales/${r.id}`);
            const saleData = res.data || res;
            const settings = { shop_name: 'Hassan Traderz', shop_address: 'Main Bazaar, Lahore', shop_phone: '+92-300-0000000', gst_rate: 17 };
            printReceiptHTML(saleData, settings, i18n.language);
          }} />
          {r.status === 'COMPLETED' && (
            <Button size="small" danger icon={<RollbackOutlined />} onClick={() => handleOpenReturnModal(r)}>
              Return
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <ShoppingOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            {t('sales.title')}
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            View completed sales transactions, invoices, and process returns
          </Text>
        </div>
      </div>

      {/* Filter Bar */}
      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <Select placeholder="Filter by Status" value={status} onChange={setStatus} allowClear style={{ width: '100%' }}>
              <Option value="COMPLETED">Completed</Option>
              <Option value="RETURNED">Returned</Option>
            </Select>
          </Col>
          <Col xs={24} sm={10}>
            <RangePicker style={{ width: '100%' }} onChange={setDateRange} />
          </Col>
          <Col xs={24} sm={6} style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchSales(1, pagination.pageSize)}>
              Filter
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setStatus(null); setDateRange(null); fetchSales(1, pagination.pageSize); }} />
          </Col>
        </Row>
      </Card>

      {/* Sales Table */}
      <Table
        dataSource={sales}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => fetchSales(page, pageSize),
        }}
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
      />

      {/* RETURN/REFUND MODAL */}
      <Modal
        title={`Process Return for Invoice ${selectedSale?.invoiceNumber}`}
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        onOk={handleProcessReturn}
        confirmLoading={submittingReturn}
        okText="Process Return & Restore Stock"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 16 }}>
          <p>Select quantities to return:</p>
          {returnItems.map((item, idx) => (
            <div key={item.saleItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, background: 'var(--bg-elevated)', padding: 8, borderRadius: 6 }}>
              <span>{item.name} (Max returnable: {item.maxQty})</span>
              <InputNumber
                min={0}
                max={item.maxQty}
                value={item.returnQty}
                onChange={(val) => {
                  const updated = [...returnItems];
                  updated[idx].returnQty = val || 0;
                  setReturnItems(updated);
                }}
              />
            </div>
          ))}
        </div>
        <div>
          <p>Return Reason:</p>
          <Input.TextArea
            rows={2}
            placeholder="e.g. Defective item, customer changed mind..."
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
