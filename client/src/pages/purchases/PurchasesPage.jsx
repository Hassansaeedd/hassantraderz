// client/src/pages/purchases/PurchasesPage.jsx — OriginKit Modern Purchases & Goods Receipt (Fixed Light Mode Contrast)
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Form,
  InputNumber, Typography, Row, Col, message, Divider, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, CheckCircleOutlined, EyeOutlined,
  ShoppingOutlined, InboxOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Option } = Select;
const { Title, Text } = Typography;

export default function PurchasesPage() {
  const { t } = useTranslation();

  const [purchases, setPurchases]   = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // Modal States
  const [createModalVisible, setCreateModalVisible]   = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase]       = useState(null);
  const [submitting, setSubmitting]                   = useState(false);

  // New PO Form Items State
  const [poItems, setPoItems] = useState([{ productId: null, quantity: 1, unitCost: 0 }]);

  useEffect(() => {
    fetchPurchases(1, 15);
    fetchSuppliers();
    fetchProducts();
  }, []);

  const fetchPurchases = async (page = 1, limit = 15) => {
    setLoading(true);
    try {
      const res = await api.get(`/purchases?page=${page}&limit=${limit}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const meta = res.pagination || res.data?.pagination || {};

      setPurchases(list);
      setPagination({
        current: meta.page || page,
        pageSize: meta.limit || limit,
        total: meta.total || list.length,
      });
    } catch (err) {
      message.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(Array.isArray(res.data) ? res.data : (res.data?.data || res || []));
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      setProducts(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch {}
  };

  const handleCreatePO = async (values) => {
    const validItems = poItems.filter(i => i.productId && i.quantity > 0 && i.unitCost >= 0);
    if (validItems.length === 0) {
      message.warning('Please select at least one valid product item');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/purchases', {
        supplierId: values.supplierId,
        supplierInvoiceNo: values.supplierInvoiceNo,
        notes: values.notes,
        items: validItems,
      });
      message.success('Purchase order created successfully');
      setCreateModalVisible(false);
      fetchPurchases(1, pagination.pageSize);
    } catch (err) {
      message.error(err?.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveGoods = async () => {
    if (!selectedPurchase) return;
    setSubmitting(true);
    try {
      const receivePayload = selectedPurchase.items.map(item => ({
        purchaseItemId: item.id,
        receivedQty: item.quantity - (item.receivedQty || 0),
      }));

      await api.post(`/purchases/${selectedPurchase.id}/receive`, { items: receivePayload });
      message.success('Goods received! Inventory stock updated.');
      setReceiveModalVisible(false);
      fetchPurchases(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err?.message || 'Failed to receive goods');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Calculations
  const totalPOValue = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const pendingCount = purchases.filter(p => p.status !== 'RECEIVED').length;

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'purchaseNumber',
      key: 'poNumber',
      render: v => <Tag color="blue" style={{ fontWeight: 700, fontSize: 13 }}>{v}</Tag>,
    },
    {
      title: 'Supplier Vendor',
      key: 'supplier',
      render: r => <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.supplier?.name || '-'}</span>,
    },
    {
      title: 'Order Date',
      dataIndex: 'purchaseDate',
      key: 'date',
      render: v => formatDateTime(v),
    },
    {
      title: 'Total Value',
      dataIndex: 'totalAmount',
      key: 'total',
      render: v => <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 14 }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const colors = { RECEIVED: 'green', PARTIALLY_RECEIVED: 'orange', DRAFT: 'default', ORDERED: 'cyan' };
        return <Tag color={colors[v] || 'blue'} style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>{v}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: r => (
        <Space>
          {r.status !== 'RECEIVED' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={async () => {
                const res = await api.get(`/purchases/${r.id}`);
                const purchaseData = res.data || res;
                setSelectedPurchase(purchaseData);
                setReceiveModalVisible(true);
              }}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 6 }}
            >
              Receive Stock
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <InboxOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            Purchases & Goods Receipts
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Manage supplier purchase orders and auto-receive inventory stock
          </Text>
        </div>

        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => fetchPurchases(pagination.current, pagination.pageSize)} />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => { setPoItems([{ productId: null, quantity: 1, unitCost: 0 }]); setCreateModalVisible(true); }}
            style={{ borderRadius: 8, fontWeight: 700 }}
          >
            Create Purchase Order
          </Button>
        </Space>
      </div>

      {/* KPI Cards — Responsive Grid */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={8}>
          <div className="kpi-card">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Total Purchase Orders</div>
            <div style={{ color: 'var(--text)', fontSize: 24, fontWeight: 800, marginTop: 4 }}>{pagination.total || purchases.length}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className="kpi-card success">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Total Orders Value</div>
            <div style={{ color: 'var(--success)', fontSize: 24, fontWeight: 800, marginTop: 4 }}>{formatCurrency(totalPOValue)}</div>
          </div>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <div className="kpi-card warning">
            <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Pending Stock Receipt</div>
            <div style={{ color: 'var(--warning)', fontSize: 24, fontWeight: 800, marginTop: 4 }}>{pendingCount} Orders</div>
          </div>
        </Col>
      </Row>

      {/* Purchases Data Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <Table
          dataSource={purchases}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ ...pagination, onChange: (page, limit) => fetchPurchases(page, limit) }}
        />
      </Card>

      {/* CREATE PO MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>New Supplier Purchase Order</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={720}
      >
        <Form layout="vertical" onFinish={handleCreatePO}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="supplierId" label="Supplier Vendor" rules={[{ required: true, message: 'Select supplier' }]}>
                <Select placeholder="Select Supplier Vendor" size="large">
                  {suppliers.map(s => <Option key={s.id} value={s.id}>{s.name} ({s.company || 'Individual'})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="supplierInvoiceNo" label="Supplier Invoice #">
                <Input placeholder="Invoice Number" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'var(--border)' }}>Product Order Lines</Divider>

          {poItems.map((item, idx) => (
            <Row gutter={8} key={idx} style={{ marginBottom: 12, background: 'var(--bg-elevated)', padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}>
              <Col span={12}>
                <Select
                  placeholder="Select Product"
                  value={item.productId}
                  onChange={(val) => {
                    const prod = products.find(p => p.id === val);
                    const updated = [...poItems];
                    updated[idx].productId = val;
                    if (prod) updated[idx].unitCost = Number(prod.purchasePrice);
                    setPoItems(updated);
                  }}
                  style={{ width: '100%' }}
                >
                  {products.map(p => <Option key={p.id} value={p.id}>{p.nameEn} ({p.sku})</Option>)}
                </Select>
              </Col>
              <Col span={5}>
                <InputNumber
                  placeholder="Qty"
                  min={1}
                  value={item.quantity}
                  onChange={(val) => { const u = [...poItems]; u[idx].quantity = val || 1; setPoItems(u); }}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={5}>
                <InputNumber
                  placeholder="Unit Cost"
                  prefix="₨"
                  min={0}
                  value={item.unitCost}
                  onChange={(val) => { const u = [...poItems]; u[idx].unitCost = val || 0; setPoItems(u); }}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={2}>
                <Button danger type="text" onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))} disabled={poItems.length === 1}>✕</Button>
              </Col>
            </Row>
          ))}

          <Button type="dashed" block onClick={() => setPoItems([...poItems, { productId: null, quantity: 1, unitCost: 0 }])} style={{ marginBottom: 16 }}>
            + Add Product Line
          </Button>

          <Form.Item name="notes" label="Order Notes">
            <Input.TextArea rows={2} placeholder="Optional purchase order details" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ height: 46, fontWeight: 700 }}>
            Create Purchase Order
          </Button>
        </Form>
      </Modal>

      {/* RECEIVE GOODS MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800 }}>Receive Stock — {selectedPurchase?.purchaseNumber}</span>}
        open={receiveModalVisible}
        onCancel={() => setReceiveModalVisible(false)}
        onOk={handleReceiveGoods}
        confirmLoading={submitting}
        okText="Receive Stock & Increment Inventory"
      >
        <Alert
          type="info"
          message="Inventory Auto-Increment"
          description="Receiving these goods will automatically add the stock quantities into your active product inventory."
          style={{ marginBottom: 16 }}
        />
        <ul style={{ paddingLeft: 20 }}>
          {selectedPurchase?.items?.map(i => (
            <li key={i.id} style={{ marginBottom: 6 }}>
              <b>{i.product?.nameEn}:</b> +{i.quantity - (i.receivedQty || 0)} units
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
