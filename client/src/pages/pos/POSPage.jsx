// client/src/pages/pos/POSPage.jsx — Modern POS Counter with Direct PDF & Thermal Receipt
import { useState, useEffect, useRef } from 'react';
import {
  Row, Col, Card, Input, Button, Table, Space, Tag, Modal,
  Form, Select, InputNumber, Divider, message, Badge, Drawer, Alert
} from 'antd';
import {
  ShoppingCartOutlined, DeleteOutlined, PlusOutlined,
  MinusOutlined, PrinterOutlined, PauseCircleOutlined,
  PlayCircleOutlined, WhatsAppOutlined, SearchOutlined,
  BarcodeOutlined, DownloadOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatters';
import { printReceiptHTML } from '../../utils/thermalPrint';
import ProductThumbnail from '../../components/common/ProductThumbnail';
import api from '../../api/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Option } = Select;

export default function POSPage() {
  const { t, i18n } = useTranslation();
  const cart = useCartStore();
  const [form] = Form.useForm();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [heldDrawerVisible, setHeldDrawerVisible] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [amountTendered, setAmountTendered] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, []);

  const fetchProducts = async (query = '', catId = null) => {
    setLoading(true);
    try {
      let url = '/products?limit=100';
      if (query) url += `&search=${encodeURIComponent(query)}`;
      if (catId) url += `&categoryId=${catId}`;
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || res || []);
      setProducts(data);
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
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
        paymentMethod: values.paymentMethod || 'CASH',
        amountPaid: Number(values.amountPaid !== undefined ? values.amountPaid : cart.totalAmount()),
        discountAmount: 0,
        paymentRef: values.paymentRef || null,
        notes: values.notes || null,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          discountPct: 0,
        })),
      };

      const res = await api.post('/sales', payload);
      const completedSale = res.data?.data || res.data || res;

      message.success(`Sale completed! Invoice ${completedSale.invoiceNumber || 'Created'}`);
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

  const handleDownloadPDFReceipt = () => {
    if (!receiptSale) return;
    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 160],
      });

      doc.setFontSize(14);
      doc.text('Hassan Traderz', 40, 10, { align: 'center' });
      doc.setFontSize(8);
      doc.text('Mobile House & Accessories', 40, 15, { align: 'center' });
      doc.text('Main Bazaar, Lahore | Ph: 0300-0000000', 40, 19, { align: 'center' });
      doc.line(5, 22, 75, 22);

      doc.setFontSize(8);
      doc.text(`Invoice: ${receiptSale.invoiceNumber}`, 5, 27);
      doc.text(`Date: ${new Date(receiptSale.saleDate || Date.now()).toLocaleDateString()}`, 5, 31);
      doc.text(`Customer: ${receiptSale.customer?.name || 'Walk-in Customer'}`, 5, 35);
      doc.line(5, 38, 75, 38);

      let y = 43;
      receiptSale.items?.forEach((i) => {
        const name = (i.product?.nameEn || i.nameEn || 'Item').slice(0, 18);
        doc.text(`${name} x${i.quantity}`, 5, y);
        doc.text(`₨ ${i.totalAmount || (i.quantity * i.unitPrice)}`, 75, y, { align: 'right' });
        y += 5;
      });

      doc.line(5, y, 75, y);
      y += 5;
      doc.text(`Subtotal: ₨ ${receiptSale.subtotal}`, 5, y);
      y += 4;
      doc.text(`GST (17%): ₨ ${receiptSale.gstAmount}`, 5, y);
      y += 5;
      doc.setFontSize(10);
      doc.text(`TOTAL: ₨ ${receiptSale.totalAmount}`, 5, y);
      y += 5;
      doc.setFontSize(8);
      doc.text(`Paid (${receiptSale.paymentMethod}): ₨ ${receiptSale.paidAmount}`, 5, y);
      y += 4;
      doc.text(`Change: ₨ ${receiptSale.changeAmount || 0}`, 5, y);
      y += 7;
      doc.text('Thank you for your business!', 40, y, { align: 'center' });

      doc.save(`Invoice_${receiptSale.invoiceNumber}.pdf`);
      message.success('Receipt PDF saved successfully to Downloads!');
    } catch {
      message.error('Failed to generate PDF receipt');
    }
  };

  const handleSendWhatsAppReceipt = () => {
    if (!receiptSale) return;
    const phone = receiptSale.customer?.phone?.replace(/[^0-9]/g, '') || '';
    const shopName = 'Hassan Traderz';
    let text = `*${shopName} — Invoice ${receiptSale.invoiceNumber}*\n`;
    text += `Date: ${new Date(receiptSale.saleDate || Date.now()).toLocaleString()}\n`;
    text += `Customer: ${receiptSale.customer?.name || 'Valued Customer'}\n------------------\n`;
    receiptSale.items?.forEach(i => {
      text += `• ${i.product?.nameEn || i.nameEn} x ${i.quantity} = ₨ ${i.totalAmount || (i.quantity * i.unitPrice)}\n`;
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

        {/* RIGHT PANEL: Shopping Cart & Checkout Summary */}
        <Col xs={24} lg={10} xl={9} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <ShoppingCartOutlined style={{ color: 'var(--primary)' }} />
                  <span>{t('pos.cart')} ({cart.itemCount()})</span>
                </Space>
                <Button danger size="small" type="text" onClick={cart.clearCart} disabled={cart.items.length === 0}>
                  {t('pos.clearCart')}
                </Button>
              </div>
            }
            bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
            style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', height: '100%' }}
          >
            {/* Customer Selector */}
            <Select
              showSearch
              placeholder="Walk-in Customer (Optional)"
              optionFilterProp="children"
              value={cart.customer?.id || null}
              onChange={(val) => {
                const c = customers.find(x => x.id === val);
                cart.setCustomer(c || null);
              }}
              allowClear
              style={{ width: '100%', marginBottom: 10 }}
            >
              {customers.map(c => (
                <Option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </Option>
              ))}
            </Select>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 10 }}>
              {cart.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <ShoppingCartOutlined style={{ fontSize: 40, marginBottom: 10, opacity: 0.4 }} />
                  <div>{t('pos.cartEmpty')}</div>
                </div>
              ) : (
                cart.items.map(item => (
                  <div
                    key={item.productId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', marginBottom: 6,
                      background: 'var(--bg-elevated)', borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isUrdu && item.nameUr ? item.nameUr : item.nameEn}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </div>
                    </div>

                    <Space size={4}>
                      <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                      />
                      <span style={{ fontWeight: 700, padding: '0 6px', minWidth: 24, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => cart.removeItem(item.productId)}
                      />
                    </Space>
                  </div>
                ))
              )}
            </div>

            {/* Billing Summary Box */}
            <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('pos.subtotal')}:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(cart.subtotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>GST (17%):</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(cart.gstAmount())}</span>
              </div>
              <Divider style={{ margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                <span>{t('pos.total')}:</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(cart.totalAmount())}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <Row gutter={[8, 8]} style={{ marginTop: 10 }}>
              <Col span={10}>
                <Button
                  block
                  size="large"
                  icon={<PauseCircleOutlined />}
                  onClick={() => {
                    cart.holdSale();
                    message.info('Sale held in memory');
                  }}
                  disabled={cart.items.length === 0}
                >
                  Hold Sale
                </Button>
              </Col>
              <Col span={14}>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={handleOpenPayment}
                  disabled={cart.items.length === 0}
                  style={{ fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                >
                  Checkout ({formatCurrency(cart.totalAmount())})
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* PAYMENT MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 17 }}>Complete Payment (ادائیگی کاؤنٹر)</span>}
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCompleteSale}>
          <div style={{ textAlign: 'center', padding: '12px 0', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Amount Payable:</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)' }}>
              {formatCurrency(cart.totalAmount())}
            </div>
          </div>

          <Form.Item name="customerId" label="Customer (گاہک)">
            <Select placeholder="Walk-in Customer" allowClear size="large">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} ({c.phone})</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="paymentMethod" label="Payment Method (ادائیگی کا طریقہ)" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="CASH">💵 Cash (نقد)</Option>
              <Option value="EASYPAISA">📱 EasyPaisa (ایزی پیسہ)</Option>
              <Option value="JAZZCASH">📱 JazzCash (جاز کیش)</Option>
              <Option value="CARD">💳 Debit / Credit Card (بینک کارڈ)</Option>
              <Option value="CREDIT">📖 Customer Khata (ادھار کھاتہ)</Option>
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amountPaid" label="Amount Tendered / Paid" rules={[{ required: true }]}>
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  onChange={(val) => setAmountTendered(val || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Change Return (بقایا رقم)">
                <div style={{
                  height: 40, lineHeight: '40px', padding: '0 12px',
                  background: 'var(--bg-elevated)', borderRadius: 8,
                  fontWeight: 800, color: 'var(--primary)', border: '1px solid var(--border)',
                }}>
                  {formatCurrency(Math.max(0, amountTendered - cart.totalAmount()))}
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="paymentRef" label="Payment Ref / Txn ID (Optional)">
            <Input placeholder="e.g. JazzCash Txn ID / Card Last 4" size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
            style={{ height: 48, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 800, fontSize: 16 }}
          >
            Complete Sale & Generate Receipt
          </Button>
        </Form>
      </Modal>

      {/* RECEIPT MODAL WITH PDF DOWNLOAD & THERMAL PRINT */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 20 }} />
            <span style={{ fontWeight: 800 }}>Sale Receipt & Invoice</span>
          </div>
        }
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        width={520}
        footer={[
          <Button key="close" onClick={() => setReceiptModalVisible(false)}>
            Close (Done)
          </Button>,
          <Button
            key="pdf"
            icon={<DownloadOutlined />}
            onClick={handleDownloadPDFReceipt}
            style={{ fontWeight: 700, borderColor: '#0284c7', color: '#0284c7' }}
          >
            Save as PDF
          </Button>,
          <Button
            key="whatsapp"
            icon={<WhatsAppOutlined style={{ color: '#25D366' }} />}
            onClick={handleSendWhatsAppReceipt}
            style={{ fontWeight: 700, borderColor: '#25D366', color: '#25D366' }}
          >
            WhatsApp
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
            Print
          </Button>
        ]}
      >
        {receiptSale && (
          <div style={{ background: '#fff', color: '#000', padding: 20, fontFamily: 'monospace', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, color: '#0f172a' }}>HASSAN TRADERZ</div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#475569' }}>Mobile Phones & Accessories House</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b' }}>Main Bazaar, Lahore | Ph: 0300-0000000</div>
            <Divider style={{ margin: '10px 0', borderColor: '#cbd5e1' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
              <span><b>Invoice #:</b> {receiptSale.invoiceNumber}</span>
              <span><b>Date:</b> {new Date(receiptSale.saleDate || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: 12, marginBottom: 6 }}>
              <b>Customer:</b> {receiptSale.customer?.name || 'Walk-in Customer'}
            </div>
            
            <Divider style={{ margin: '8px 0', borderColor: '#cbd5e1' }} />
            
            <div style={{ fontWeight: 'bold', fontSize: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>ITEM</span>
              <span>TOTAL</span>
            </div>

            {receiptSale.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                <span>{item.product?.nameEn || item.nameEn} x {item.quantity}</span>
                <span>₨ {(item.totalAmount || (item.quantity * item.unitPrice)).toLocaleString()}</span>
              </div>
            ))}

            <Divider style={{ margin: '8px 0', borderColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>Subtotal:</span><span>₨ {Number(receiptSale.subtotal).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>GST (17%):</span><span>₨ {Number(receiptSale.gstAmount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 15, margin: '4px 0', color: '#059669' }}>
              <span>TOTAL AMOUNT:</span><span>₨ {Number(receiptSale.totalAmount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>Paid ({receiptSale.paymentMethod}):</span><span>₨ {Number(receiptSale.paidAmount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>Change Return:</span><span>₨ {Number(receiptSale.changeAmount || 0).toLocaleString()}</span>
            </div>

            <Divider style={{ margin: '10px 0', borderColor: '#cbd5e1' }} />
            <div style={{ textAlign: 'center', fontSize: 11, color: '#475569' }}>Thank you for shopping at Hassan Traderz!</div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>Goods once sold will not be returned without invoice</div>
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
