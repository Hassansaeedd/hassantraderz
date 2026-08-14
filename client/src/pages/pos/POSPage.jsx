// client/src/pages/pos/POSPage.jsx — POS Sales Counter with Professional Product Thumbnails & Logo
import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Input, Button, Tag, Badge, Select, Space,
  Modal, Form, InputNumber, Divider, Drawer, message
} from 'antd';
import {
  SearchOutlined, ShoppingCartOutlined, DeleteOutlined,
  PlusOutlined, MinusOutlined, CheckCircleOutlined,
  PrinterOutlined, PauseCircleOutlined, PlayCircleOutlined,
  BarcodeOutlined, WhatsAppOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatters';
import { printReceiptHTML } from '../../utils/thermalPrint';
import ProductThumbnail from '../../components/common/ProductThumbnail';

const { Option } = Select;

export default function POSPage() {
  const { t, i18n } = useTranslation();
  const cart        = useCartStore();

  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Checkout Modal State
  const [payModalVisible, setPayModalVisible]       = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptSale, setReceiptSale]               = useState(null);
  const [heldDrawerVisible, setHeldDrawerVisible]   = useState(false);
  const [amountTendered, setAmountTendered]         = useState(0);
  const [submitting, setSubmitting]                 = useState(false);
  const [form]                                      = Form.useForm();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, []);

  const fetchProducts = async (q = searchQuery, catId = selectedCategory) => {
    try {
      let url = '/products?limit=100';
      if (q) url += `&search=${encodeURIComponent(q)}`;
      if (catId) url += `&categoryId=${catId}`;
      const res = await api.get(url);
      setProducts(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch {
      message.error('Failed to load products');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : (res.data?.data || res || []));
    } catch {}
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(Array.isArray(res.data) ? res.data : (res.data?.data || res || []));
    } catch {}
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const exactMatch = products.find(p => p.barcode === val.trim() || p.sku === val.trim());
      if (exactMatch && exactMatch.currentStock > 0) {
        cart.addItem(exactMatch);
        setSearchQuery('');
        return;
      }
    }
    fetchProducts(val, selectedCategory);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    fetchProducts(searchQuery, catId);
  };

  const handleOpenPayment = () => {
    if (cart.items.length === 0) return;
    setAmountTendered(cart.totalAmount());
    form.setFieldsValue({
      paymentMethod: 'CASH',
      amountPaid: cart.totalAmount(),
      customerId: cart.customer?.id || null,
    });
    setPayModalVisible(true);
  };

  const handleCompleteSale = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        customerId: values.customerId || null,
        paymentMethod: values.paymentMethod,
        paidAmount: Number(values.amountPaid),
        paymentRef: values.paymentRef || null,
        notes: values.notes || null,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await api.post('/sales', payload);
      const completedSale = res.data || res;

      message.success(`Sale completed! Invoice ${completedSale.invoiceNumber}`);
      setPayModalVisible(false);
      setReceiptSale(completedSale);
      setReceiptModalVisible(true);
      cart.clearCart();
      fetchProducts();
    } catch (err) {
      message.error(err?.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsAppReceipt = () => {
    if (!receiptSale) return;
    const phone = receiptSale.customer?.phone?.replace(/[^0-9]/g, '') || '';
    const shopName = 'Hassan Traderz';
    let text = `*${shopName} — Invoice ${receiptSale.invoiceNumber}*\n`;
    text += `Date: ${new Date(receiptSale.saleDate).toLocaleString()}\n`;
    text += `Customer: ${receiptSale.customer?.name || 'Valued Customer'}\n------------------\n`;
    receiptSale.items?.forEach(i => {
      text += `• ${i.product?.nameEn || i.nameEn} x ${i.quantity} = ₨ ${i.totalAmount}\n`;
    });
    text += `------------------\n*Total Amount: ₨ ${receiptSale.totalAmount}*\nPaid: ₨ ${receiptSale.paidAmount}\nThank you for shopping at Hassan Traderz!`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isUrdu = i18n.language === 'ur';

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      <Row gutter={[16, 16]} style={{ flex: 1, minHeight: 0 }}>
        
        {/* LEFT PANEL: Product Catalog */}
        <Col xs={24} lg={14} xl={15} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', height: '100%' }}
          >
            {/* Search + Actions */}
            <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
              <Col flex="auto">
                <Input
                  size="large"
                  prefix={<SearchOutlined style={{ color: 'var(--primary)' }} />}
                  suffix={<BarcodeOutlined style={{ color: 'var(--text-muted)' }} />}
                  placeholder={t('pos.searchProduct')}
                  value={searchQuery}
                  onChange={handleSearch}
                  data-barcode-target="true"
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col flex="none">
                <Badge count={cart.heldSales.length} overflowCount={99}>
                  <Button
                    size="large"
                    icon={<PauseCircleOutlined />}
                    onClick={() => setHeldDrawerVisible(true)}
                  >
                    {t('pos.holdSale')} ({cart.heldSales.length})
                  </Button>
                </Badge>
              </Col>
            </Row>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
              <Tag.CheckableTag
                checked={selectedCategory === null}
                onChange={() => handleCategorySelect(null)}
                style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13 }}
              >
                All Categories
              </Tag.CheckableTag>
              {categories.map(cat => (
                <Tag.CheckableTag
                  key={cat.id}
                  checked={selectedCategory === cat.id}
                  onChange={() => handleCategorySelect(cat.id)}
                  style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13 }}
                >
                  {isUrdu ? cat.nameUr || cat.nameEn : cat.nameEn}
                </Tag.CheckableTag>
              ))}
            </div>

            {/* Products Grid */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              <Row gutter={[12, 12]}>
                {products.map(p => {
                  const outOfStock = p.currentStock <= 0;
                  return (
                    <Col xs={12} sm={8} md={6} key={p.id}>
                      <Card
                        hoverable={!outOfStock}
                        onClick={() => !outOfStock && cart.addItem(p)}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          opacity: outOfStock ? 0.5 : 1,
                          cursor: outOfStock ? 'not-allowed' : 'pointer',
                        }}
                        bodyStyle={{ padding: 10 }}
                      >
                        <div style={{ height: 75, marginBottom: 8, borderRadius: 6, overflow: 'hidden' }}>
                          <ProductThumbnail product={p} size={75} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isUrdu && p.nameUr ? p.nameUr : p.nameEn}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 13.5 }}>
                            {formatCurrency(p.sellingPrice)}
                          </span>
                          <Tag color={outOfStock ? 'red' : p.currentStock <= p.minStockLevel ? 'orange' : 'green'} style={{ margin: 0, fontWeight: 700 }}>
                            {p.currentStock}
                          </Tag>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Card>
        </Col>

        {/* RIGHT PANEL: POS Cart & Checkout */}
        <Col xs={24} lg={10} xl={9} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', height: '100%' }}
          >
            {/* Cart Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCartOutlined style={{ color: 'var(--primary)' }} /> {t('pos.cart')} ({cart.itemCount()})
              </div>
              <Button type="text" danger icon={<DeleteOutlined />} onClick={cart.clearCart} disabled={cart.items.length === 0}>
                Clear
              </Button>
            </div>

            {/* Customer Select */}
            <Select
              showSearch
              placeholder={t('pos.selectCustomer')}
              optionFilterProp="children"
              value={cart.customer?.id || null}
              onChange={(val) => cart.setCustomer(customers.find(c => c.id === val) || null)}
              allowClear
              style={{ width: '100%', marginBottom: 12 }}
            >
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</Option>
              ))}
            </Select>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
                  <div>{t('pos.emptyCart')}</div>
                </div>
              ) : (
                cart.items.map(item => (
                  <div key={item.productId} className="cart-item" style={{ background: 'var(--bg-elevated)', padding: 10, borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      <span>{isUrdu ? item.nameUr : item.nameEn}</span>
                      <span>{formatCurrency(item.lineTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatCurrency(item.unitPrice)} x {item.quantity}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Button size="small" icon={<MinusOutlined />} onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)} />
                        <span style={{ fontWeight: 600, width: 24, textAlign: 'center' }}>{item.quantity}</span>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)} />
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => cart.removeItem(item.productId)} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Totals Summary */}
            <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>{t('pos.subtotal')}:</span>
                <span>{formatCurrency(cart.subtotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>GST (17%):</span>
                <span>{formatCurrency(cart.gstAmount())}</span>
              </div>
              <Divider style={{ margin: '8px 0', borderColor: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
                <span>{t('pos.total')}:</span>
                <span>{formatCurrency(cart.totalAmount())}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <Row gutter={8}>
              <Col span={8}>
                <Button block size="large" onClick={cart.holdSale} disabled={cart.items.length === 0}>
                  {t('pos.holdSale')}
                </Button>
              </Col>
              <Col span={16}>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={handleOpenPayment}
                  disabled={cart.items.length === 0}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', height: 44, fontWeight: 700, fontSize: 16 }}
                >
                  {t('pos.pay')}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* PAYMENT MODAL */}
      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>{t('pos.payment')} — Total: {formatCurrency(cart.totalAmount())}</span>}
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCompleteSale}>
          <Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="CASH">💵 Cash (نقد)</Option>
              <Option value="CARD">💳 Card</Option>
              <Option value="EASYPAISA">📱 EasyPaisa (ایزی پیسہ)</Option>
              <Option value="JAZZCASH">📱 JazzCash (جاز کیش)</Option>
              <Option value="BANK_TRANSFER">🏦 Bank Transfer</Option>
            </Select>
          </Form.Item>

          <Form.Item name="customerId" label="Customer">
            <Select placeholder="Select Customer" allowClear size="large">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} ({c.phone || 'No phone'})</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amountPaid" label={t('pos.amountPaid')} rules={[{ required: true }]}>
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  prefix="₨"
                  onChange={(val) => setAmountTendered(val || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('pos.changeDue')}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)', paddingTop: 4 }}>
                  {formatCurrency(Math.max(0, amountTendered - cart.totalAmount()))}
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="paymentRef" label="Payment Reference / Txn ID (Optional)">
            <Input placeholder="Enter Transaction Ref / Card Last 4 Digits" size="large" />
          </Form.Item>

          <Form.Item name="notes" label="Sale Notes (Optional)">
            <Input.TextArea rows={2} placeholder="Internal notes" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
            style={{ height: 48, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 700, fontSize: 16 }}
          >
            Complete Sale & Print Receipt
          </Button>
        </Form>
      </Modal>

      {/* RECEIPT MODAL WITH WHATSAPP RECEIPT */}
      <Modal
        title="Sale Receipt"
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setReceiptModalVisible(false)}>Close</Button>,
          <Button
            key="whatsapp"
            icon={<WhatsAppOutlined style={{ color: '#25D366' }} />}
            onClick={handleSendWhatsAppReceipt}
            style={{ fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}
          >
            Send WhatsApp Receipt
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => {
              const settings = { shop_name: 'Hassan Traderz', shop_address: 'Main Bazaar, Lahore', shop_phone: '+92-300-0000000', gst_rate: 17 };
              printReceiptHTML(receiptSale, settings, i18n.language);
            }}
            style={{ fontWeight: 700 }}
          >
            Print Thermal Receipt (80mm)
          </Button>
        ]}
      >
        {receiptSale && (
          <div style={{ background: '#fff', color: '#000', padding: 16, fontFamily: 'monospace', borderRadius: 6 }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Hassan Traderz</div>
            <div style={{ textAlign: 'center', fontSize: 12 }}>Main Bazaar, Lahore</div>
            <Divider style={{ margin: '8px 0' }} />
            <div><b>Invoice #:</b> {receiptSale.invoiceNumber}</div>
            <div><b>Date:</b> {new Date(receiptSale.saleDate).toLocaleString()}</div>
            <div><b>Customer:</b> {receiptSale.customer?.name || 'Walk-in Customer'}</div>
            <Divider style={{ margin: '8px 0' }} />
            {receiptSale.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>{item.product?.nameEn || item.nameEn} x {item.quantity}</span>
                <span>{formatCurrency(item.totalAmount)}</span>
              </div>
            ))}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>{formatCurrency(receiptSale.subtotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST (17%):</span><span>{formatCurrency(receiptSale.gstAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14 }}><span>TOTAL:</span><span>{formatCurrency(receiptSale.totalAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid:</span><span>{formatCurrency(receiptSale.paidAmount)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Change:</span><span>{formatCurrency(receiptSale.changeAmount)}</span></div>
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11 }}>Thank you for shopping at Hassan Traderz!</div>
          </div>
        )}
      </Modal>

      {/* HELD SALES DRAWER */}
      <Drawer title="Held Transactions" placement="right" onClose={() => setHeldDrawerVisible(false)} open={heldDrawerVisible}>
        {cart.heldSales.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No held sales</div>
        ) : (
          cart.heldSales.map(sale => (
            <Card key={sale.id} size="small" style={{ marginBottom: 12, background: 'var(--bg-elevated)' }}>
              <div><b>Held At:</b> {new Date(sale.heldAt).toLocaleTimeString()}</div>
              <div><b>Items:</b> {sale.items.length}</div>
              <Space style={{ marginTop: 8 }}>
                <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => { cart.resumeHeld(sale.id); setHeldDrawerVisible(false); }}>Resume</Button>
                <Button danger size="small" icon={<DeleteOutlined />} onClick={() => cart.removeHeld(sale.id)}>Discard</Button>
              </Space>
            </Card>
          ))
        )}
      </Drawer>
    </div>
  );
}
