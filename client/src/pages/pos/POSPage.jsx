// client/src/pages/pos/POSPage.jsx — Paginated Modern POS Counter with Sticky Cart & Direct Receipts
import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Input, Button, Space, Tag, Modal,
  Form, Select, InputNumber, Divider, message, Badge, Drawer, Pagination
} from 'antd';
import {
  ShoppingCartOutlined, DeleteOutlined, PlusOutlined,
  MinusOutlined, PrinterOutlined, PauseCircleOutlined,
  PlayCircleOutlined, WhatsAppOutlined, SearchOutlined,
  DownloadOutlined, CheckCircleOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatters';
import { printReceiptHTML } from '../../utils/thermalPrint';
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalProducts, setTotalProducts] = useState(0);

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [heldDrawerVisible, setHeldDrawerVisible] = useState(false);
  const [mobileCartDrawer, setMobileCartDrawer] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  const [amountTendered, setAmountTendered] = useState(0);

  useEffect(() => {
    fetchProducts('', null, 1);
    fetchCategories();
    fetchCustomers();

    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProducts = async (query = searchQuery, catId = selectedCategory, page = 1) => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&limit=${pageSize}`;
      if (query) url += `&search=${encodeURIComponent(query)}`;
      if (catId) url += `&categoryId=${catId}`;
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || res || []);
      const meta = res.pagination || res.data?.pagination || {};
      setProducts(data);
      setTotalProducts(meta.total !== undefined ? meta.total : (data.length || 0));
      setCurrentPage(page);
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
    fetchProducts(val, selectedCategory, 1);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    fetchProducts(searchQuery, catId, 1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProducts(searchQuery, selectedCategory, page);
  };

  const handleOpenPayment = () => {
    if (cart.items.length === 0) return;
    setAmountTendered(cart.totalAmount());
    form.setFieldsValue({
      paymentMethod: 'CASH',
      amountPaid: cart.totalAmount(),
      customerId: cart.customer?.id || null,
      notes: '',
    });
    setMobileCartDrawer(false);
    setPayModalVisible(true);
  };

  const handleCompleteSale = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        customerId: values.customerId || null,
        paymentMethod: values.paymentMethod || 'CASH',
        amountPaid: Number(values.amountPaid || cart.totalAmount()),
        paidAmount: Number(values.amountPaid || cart.totalAmount()),
        paymentRef: values.paymentRef || null,
        notes: values.notes || null,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPct: 0,
        })),
      };

      const res = await api.post('/sales', payload);
      const createdSale = res.data?.data || res.data || res;

      const saleRecord = {
        ...createdSale,
        invoiceNumber: createdSale.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        items: cart.items.map(i => ({
          ...i,
          product: { nameEn: i.nameEn, nameUr: i.nameUr },
          totalAmount: i.unitPrice * i.quantity,
        })),
        subtotal: cart.subtotal(),
        gstAmount: cart.gstAmount(),
        totalAmount: cart.totalAmount(),
        paidAmount: values.amountPaid,
        changeAmount: Math.max(0, values.amountPaid - cart.totalAmount()),
        paymentMethod: values.paymentMethod,
        customer: cart.customer,
        saleDate: new Date().toISOString(),
      };

      setReceiptSale(saleRecord);
      cart.clearCart();
      setPayModalVisible(false);
      setReceiptModalVisible(true);
      fetchProducts(searchQuery, selectedCategory, currentPage);
      message.success('Sale completed successfully!');
    } catch (err) {
      message.error(err?.message || 'Failed to complete transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Direct Save-to-Computer PDF Receipt Generator
  const handleDownloadPDFReceipt = () => {
    if (!receiptSale) return;
    try {
      const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('HASSAN TRADERZ', 40, 10, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Mobile Phones & Accessories', 40, 15, { align: 'center' });
      doc.text('Main Bazaar, Lahore | Ph: 0300-0000000', 40, 19, { align: 'center' });

      doc.line(5, 22, 75, 22);

      doc.setFontSize(8);
      doc.text(`Invoice #: ${receiptSale.invoiceNumber || 'INV-001'}`, 5, 26);
      doc.text(`Date: ${new Date(receiptSale.saleDate || Date.now()).toLocaleDateString()}`, 5, 30);
      doc.text(`Customer: ${receiptSale.customer?.name || 'Walk-in Customer'}`, 5, 34);

      doc.line(5, 36, 75, 36);

      const tableData = receiptSale.items?.map(i => [
        i.product?.nameEn || i.nameEn,
        i.quantity,
        `Rs. ${Number(i.unitPrice).toLocaleString()}`,
        `Rs. ${(i.quantity * i.unitPrice).toLocaleString()}`
      ]) || [];

      doc.autoTable({
        startY: 38,
        margin: { left: 5, right: 5 },
        styles: { fontSize: 7, cellPadding: 1 },
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: tableData,
        theme: 'plain',
      });

      const finalY = doc.lastAutoTable.finalY + 4;
      doc.line(5, finalY, 75, finalY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`TOTAL:`, 5, finalY + 5);
      doc.text(`Rs. ${Number(receiptSale.totalAmount || receiptSale.subtotal || 0).toLocaleString()}`, 75, finalY + 5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Paid (${receiptSale.paymentMethod}):`, 5, finalY + 17);
      doc.text(`Rs. ${Number(receiptSale.paidAmount || 0).toLocaleString()}`, 75, finalY + 17, { align: 'right' });

      doc.text(`Change Return:`, 5, finalY + 21);
      doc.text(`Rs. ${Number(receiptSale.changeAmount || 0).toLocaleString()}`, 75, finalY + 21, { align: 'right' });

      doc.line(5, finalY + 24, 75, finalY + 24);
      doc.setFontSize(7);
      doc.text('Thank you for shopping at Hassan Traderz!', 40, finalY + 28, { align: 'center' });
      doc.text('Goods once sold will not be returned without bill', 40, finalY + 31, { align: 'center' });

      doc.save(`Invoice_${receiptSale.invoiceNumber || 'INV'}.pdf`);
      message.success('Receipt PDF downloaded to computer!');
    } catch (err) {
      message.error('Failed to generate PDF: ' + err.message);
    }
  };

  const handleSendWhatsAppReceipt = () => {
    if (!receiptSale) return;
    const phone = receiptSale.customer?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const lines = [
      `*HASSAN TRADERZ - SALES RECEIPT*`,
      `Invoice #: ${receiptSale.invoiceNumber}`,
      `Date: ${new Date(receiptSale.saleDate || Date.now()).toLocaleDateString()}`,
      `Customer: ${receiptSale.customer?.name || 'Walk-in Customer'}`,
      `---------------------------------`,
      ...(receiptSale.items?.map(i => `• ${i.product?.nameEn || i.nameEn} x ${i.quantity} = Rs. ${(i.quantity * i.unitPrice).toLocaleString()}`) || []),
      `---------------------------------`,
      `*Total Amount: Rs. ${Number(receiptSale.totalAmount).toLocaleString()}*`,
      `Paid via: ${receiptSale.paymentMethod}`,
      `---------------------------------`,
      `Thank you for shopping with us!`,
    ];

    const messageText = encodeURIComponent(lines.join('\n'));
    const url = cleanPhone ? `https://wa.me/92${cleanPhone.replace(/^0/, '')}?text=${messageText}` : `https://wa.me/?text=${messageText}`;
    window.open(url, '_blank');
  };

  const isUrdu = i18n.language === 'ur';

  // Shopping Cart Render Component
  const renderCartContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
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
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 10, minHeight: 120 }}>
        {cart.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            <ShoppingCartOutlined style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }} />
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
                <span style={{ fontWeight: 700, padding: '0 6px', minWidth: 22, textAlign: 'center', color: 'var(--text)' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Items Count:</span>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{cart.itemCount()} items</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text)' }}>{t('pos.total')}:</span>
          <span style={{ color: 'var(--primary)', fontSize: 18 }}>{formatCurrency(cart.totalAmount())}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <Row gutter={[8, 8]} style={{ marginTop: 10 }}>
        <Col span={9}>
          <Button
            block
            size="large"
            icon={<PauseCircleOutlined />}
            onClick={() => {
              cart.holdSale();
              message.info('Sale held in memory');
            }}
            disabled={cart.items.length === 0}
            style={{ fontSize: 13 }}
          >
            Hold
          </Button>
        </Col>
        <Col span={15}>
          <Button
            type="primary"
            block
            size="large"
            onClick={handleOpenPayment}
            disabled={cart.items.length === 0}
            style={{ fontWeight: 800, fontSize: 14 }}
          >
            Checkout ({formatCurrency(cart.totalAmount())})
          </Button>
        </Col>
      </Row>
    </div>
  );

  return (
    <div className="fade-in" style={{ paddingBottom: isMobile && cart.items.length > 0 ? 70 : 0 }}>
      {/* Top Bar: Search, Category Filter, and Held Sales Badge */}
      <Row gutter={[10, 10]} align="middle" style={{ marginBottom: 14 }}>
        <Col xs={16} sm={18} md={12} lg={8}>
          <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            placeholder={t('pos.searchPlaceholder')}
            value={searchQuery}
            onChange={handleSearch}
            allowClear
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Col>

        <Col xs={8} sm={6} md={6} lg={4} style={{ textAlign: 'right' }}>
          <Badge count={cart.heldSales.length} offset={[-4, 4]}>
            <Button
              icon={<PauseCircleOutlined />}
              onClick={() => setHeldDrawerVisible(true)}
              size="large"
              block
              style={{ borderRadius: 8 }}
            >
              Held ({cart.heldSales.length})
            </Button>
          </Badge>
        </Col>
      </Row>

      {/* Category Pills (Touch-Friendly Horizontal Scroll) */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 10,
        marginBottom: 12,
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}>
        <Button
          size="middle"
          type={selectedCategory === null ? 'primary' : 'default'}
          onClick={() => handleCategorySelect(null)}
          style={{ borderRadius: 20, flexShrink: 0, fontWeight: 600 }}
        >
          {t('pos.allCategories')}
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            size="middle"
            type={selectedCategory === cat.id ? 'primary' : 'default'}
            onClick={() => handleCategorySelect(cat.id)}
            style={{ borderRadius: 20, flexShrink: 0, fontWeight: 600 }}
          >
            {isUrdu && cat.nameUr ? cat.nameUr : cat.nameEn}
          </Button>
        ))}
      </div>

      {/* Main Content: Left Product Catalog Grid & Right Cart (Sticky on Desktop) */}
      <Row gutter={[14, 14]}>
        {/* LEFT PANEL: Product Grid with Pagination */}
        <Col xs={24} lg={14} xl={15}>
          <Card bodyStyle={{ padding: 12 }} style={{ minHeight: 450, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {products.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                <div>No products found matching your filter</div>
              </div>
            ) : (
              <div>
                <Row gutter={[10, 10]}>
                  {products.map(p => {
                    const outOfStock = p.currentStock <= 0;
                    return (
                      <Col xs={12} sm={8} md={6} lg={8} xl={6} key={p.id}>
                        <Card
                          hoverable
                          size="small"
                          onClick={() => !outOfStock && cart.addItem(p)}
                          style={{
                            opacity: outOfStock ? 0.45 : 1,
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                          bodyStyle={{ padding: 8 }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4, minHeight: 34 }}>
                            {isUrdu && p.nameUr ? p.nameUr : p.nameEn}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                            {p.sku}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
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
            )}

            {/* Pagination Controls */}
            {totalProducts > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalProducts}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* RIGHT PANEL: Floating Sticky Shopping Cart (Desktop >= 992px) */}
        {!isMobile && (
          <Col xs={24} lg={10} xl={9} style={{ position: 'sticky', top: 76, height: 'calc(100vh - 96px)', zIndex: 10 }}>
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
              bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', height: 'calc(100% - 46px)' }}
              style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', height: '100%' }}
            >
              {renderCartContent()}
            </Card>
          </Col>
        )}
      </Row>

      {/* STICKY FLOATING QUICK-CART BAR FOR MOBILE / TABLET (< 992px) */}
      {isMobile && cart.items.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          right: 12,
          background: 'var(--primary)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 999,
          cursor: 'pointer',
        }} onClick={() => setMobileCartDrawer(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingCartOutlined style={{ fontSize: 20 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{cart.itemCount()} items</div>
              <div style={{ fontSize: 11.5, opacity: 0.9 }}>{formatCurrency(cart.totalAmount())}</div>
            </div>
          </div>

          <Button
            size="middle"
            style={{ background: '#fff', color: 'var(--primary)', fontWeight: 800, border: 'none', borderRadius: 8 }}
          >
            View Cart <ArrowRightOutlined />
          </Button>
        </div>
      )}

      {/* MOBILE CART DRAWER (< 992px) */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <ShoppingCartOutlined style={{ color: 'var(--primary)' }} />
              <span>Cart ({cart.itemCount()} items)</span>
            </Space>
            <Button danger size="small" type="text" onClick={cart.clearCart}>Clear</Button>
          </div>
        }
        placement="bottom"
        height="85%"
        onClose={() => setMobileCartDrawer(false)}
        open={mobileCartDrawer}
        bodyStyle={{ padding: 14, background: 'var(--bg-container)' }}
      >
        {renderCartContent()}
      </Drawer>

      {/* PAYMENT MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 16 }}>Complete Payment (ادائیگی کاؤنٹر)</span>}
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleCompleteSale}>
          <div style={{ textAlign: 'center', padding: '10px 0', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Amount Payable:</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)' }}>
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

          <Row gutter={10}>
            <Col span={12}>
              <Form.Item name="amountPaid" label="Amount Paid" rules={[{ required: true }]}>
                <InputNumber
                  size="large"
                  style={{ width: '100%' }}
                  onChange={(val) => setAmountTendered(val || 0)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Change Return">
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

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
            style={{ height: 46, fontWeight: 800, fontSize: 15, marginTop: 4 }}
          >
            Complete Sale & Receipt
          </Button>
        </Form>
      </Modal>

      {/* RECEIPT MODAL */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} />
            <span style={{ fontWeight: 800 }}>Sale Receipt & Invoice</span>
          </div>
        }
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        width={480}
        footer={[
          <Button key="close" onClick={() => setReceiptModalVisible(false)}>
            Done
          </Button>,
          <Button
            key="pdf"
            icon={<DownloadOutlined />}
            onClick={handleDownloadPDFReceipt}
            style={{ fontWeight: 700, borderColor: '#0284c7', color: '#0284c7' }}
          >
            Save PDF
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
          <div style={{ background: '#fff', color: '#000', padding: 16, fontFamily: 'monospace', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#0f172a' }}>HASSAN TRADERZ</div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#475569' }}>Mobile Phones & Accessories House</div>
            <div style={{ textAlign: 'center', fontSize: 10.5, color: '#64748b' }}>Main Bazaar, Lahore | Ph: 0300-0000000</div>
            <Divider style={{ margin: '8px 0', borderColor: '#cbd5e1' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
              <span><b>Invoice #:</b> {receiptSale.invoiceNumber}</span>
              <span><b>Date:</b> {new Date(receiptSale.saleDate || Date.now()).toLocaleDateString()}</span>
            </div>
            <div style={{ fontSize: 11.5, marginBottom: 4 }}>
              <b>Customer:</b> {receiptSale.customer?.name || 'Walk-in Customer'}
            </div>
            
            <Divider style={{ margin: '6px 0', borderColor: '#cbd5e1' }} />

            {receiptSale.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}>
                <span>{item.product?.nameEn || item.nameEn} x {item.quantity}</span>
                <span>₨ {(item.totalAmount || (item.quantity * item.unitPrice)).toLocaleString()}</span>
              </div>
            ))}

            <Divider style={{ margin: '6px 0', borderColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span>Subtotal:</span><span>₨ {Number(receiptSale.subtotal).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span>GST (17%):</span><span>₨ {Number(receiptSale.gstAmount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14, margin: '4px 0', color: '#059669' }}>
              <span>TOTAL:</span><span>₨ {Number(receiptSale.totalAmount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span>Paid ({receiptSale.paymentMethod}):</span><span>₨ {Number(receiptSale.paidAmount).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span>Change Return:</span><span>₨ {Number(receiptSale.changeAmount || 0).toLocaleString()}</span>
            </div>
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
