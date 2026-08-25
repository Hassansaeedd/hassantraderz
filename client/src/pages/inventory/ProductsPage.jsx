// client/src/pages/inventory/ProductsPage.jsx — Product & Stock Management with Bulk CSV Import
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Tag, Space, Modal, Upload,
  message, Popconfirm, Image, Typography, Row, Col, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  WarningOutlined, ReloadOutlined, AppstoreOutlined, FileExcelOutlined,
  UploadOutlined, DownloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency, getStockStatus } from '../../utils/formatters';

const { Option } = Select;
const { Title, Text }  = Typography;

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();

  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [brands, setBrands]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [categoryId, setCategoryId]   = useState(null);
  const [brandId, setBrandId]         = useState(null);
  const [pagination, setPagination]   = useState({ current: 1, pageSize: 15, total: 0 });

  // CSV Import Modal State
  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [csvFile, setCsvFile]                 = useState(null);
  const [importing, setImporting]             = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts(1, 15);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : (res.data?.data || res || []));
    } catch {}
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      setBrands(Array.isArray(res.data) ? res.data : (res.data?.data || res || []));
    } catch {}
  };

  const fetchProducts = async (page = 1, limit = 15) => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (brandId) url += `&brandId=${brandId}`;

      const res = await api.get(url);
      const productList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const meta = res.pagination || res.data?.pagination || {};

      setProducts(productList);
      setPagination({
        current: meta.page || page,
        pageSize: meta.limit || limit,
        total: meta.total || productList.length,
      });
    } catch (err) {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('Product deactivated');
      fetchProducts(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error(err?.message || 'Delete failed');
    }
  };

  // CSV Import Handler
  const handleDownloadSampleCSV = () => {
    const csvContent = `nameEn,nameUr,sku,barcode,purchasePrice,sellingPrice,currentStock,minStockLevel
Samsung Galaxy A15,سیمسنگ A15,MOB-A15-01,88060900011,38000,45000,10,3
Redmi 13C,ریڈمی 13C,MOB-R13C-02,69418100022,26000,31999,15,4
Airpods Pro Wireless,ایئرپاڈز پرو,ACC-APP-03,19594900033,4500,6500,20,5
Fast Charger 65W,فاسٹ چارجر,ACC-FC65-04,69218000044,1200,2200,30,5`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Hassan_Traderz_Sample_Inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessCSVImport = () => {
    if (!csvFile) {
      message.warning('Please select a CSV file first');
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          message.warning('CSV file is empty or missing data rows');
          setImporting(false);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const items = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 2) continue;

          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });

          if (rowObj.nameEn && rowObj.sellingPrice) {
            items.push(rowObj);
          }
        }

        if (items.length === 0) {
          message.warning('No valid product records found in CSV');
          setImporting(false);
          return;
        }

        const res = await api.post('/products/bulk-csv', { items });
        message.success(res.message || `Successfully imported ${items.length} products!`);
        setCsvModalVisible(false);
        setCsvFile(null);
        fetchProducts(1, pagination.pageSize);
      } catch (err) {
        message.error(err?.message || 'CSV Import failed');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(csvFile);
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 70,
      render: (img) => img ? <Image src={img} width={40} height={40} style={{ objectFit: 'contain' }} /> : <span style={{ fontSize: 24 }}>📱</span>,
    },
    {
      title: t('products.name'),
      key: 'name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>{i18n.language === 'ur' && r.nameUr ? r.nameUr : r.nameEn}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.nameEn !== r.nameUr ? r.nameEn : ''}</div>
        </div>
      ),
    },
    {
      title: t('products.sku'),
      dataIndex: 'sku',
      key: 'sku',
      render: (sku) => <Tag color="blue" style={{ fontWeight: 700 }}>{sku}</Tag>,
    },
    {
      title: t('products.category'),
      key: 'category',
      render: (r) => r.category ? (i18n.language === 'ur' ? r.category.nameUr || r.category.nameEn : r.category.nameEn) : '-',
    },
    {
      title: t('products.brand'),
      key: 'brand',
      render: (r) => r.brand?.name || '-',
    },
    {
      title: t('products.sellingPrice'),
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (val) => <span style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(val)}</span>,
    },
    {
      title: t('products.stock'),
      key: 'stock',
      render: (r) => {
        const status = getStockStatus(r.currentStock, r.minStockLevel);
        return (
          <Space>
            <Tag color={status.color} style={{ fontWeight: 700 }}>{r.currentStock}</Tag>
            {r.currentStock <= r.minStockLevel && (
              <WarningOutlined style={{ color: 'var(--warning)' }} />
            )}
          </Space>
        );
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/products/${r.id}/edit`)} />
          <Popconfirm title="Deactivate product?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <AppstoreOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            {t('products.title')}
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Manage smartphones, accessories, SKU codes, prices and bulk CSV inventory import
          </Text>
        </div>

        <Space style={{ marginTop: 10 }}>
          <Button
            icon={<FileExcelOutlined style={{ color: '#10b981' }} />}
            onClick={() => setCsvModalVisible(true)}
            style={{ fontWeight: 700, borderRadius: 8 }}
          >
            Import CSV File
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/products/new')}
            style={{ fontWeight: 700, borderRadius: 8 }}
          >
            {t('products.add')}
          </Button>
        </Space>
      </div>

      {/* Filter Bar */}
      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="Search by name, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => fetchProducts(1, pagination.pageSize)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select placeholder="Category" value={categoryId} onChange={setCategoryId} allowClear style={{ width: '100%' }}>
              {categories.map(c => <Option key={c.id} value={c.id}>{c.nameEn}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select placeholder="Brand" value={brandId} onChange={setBrandId} allowClear style={{ width: '100%' }}>
              {brands.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={2} md={6} style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchProducts(1, pagination.pageSize)}>
              Filter
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setCategoryId(null); setBrandId(null); fetchProducts(1, pagination.pageSize); }} />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => fetchProducts(page, pageSize),
        }}
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
      />

      {/* BULK CSV IMPORT MODAL */}
      <Modal
        title={<span style={{ fontWeight: 800, fontSize: 18 }}>Bulk CSV Inventory Import</span>}
        open={csvModalVisible}
        onCancel={() => setCsvModalVisible(false)}
        footer={null}
        width={580}
      >
        <Alert
          type="info"
          showIcon
          message="Fast Stock & Product Import"
          description="Upload your Excel/CSV sheet containing products, prices, and stock numbers to add hundreds of items into your shop inventory at once."
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            block
            icon={<DownloadOutlined />}
            onClick={handleDownloadSampleCSV}
            style={{ marginBottom: 16, height: 40, fontWeight: 600 }}
          >
            Download Sample CSV Template (.csv)
          </Button>

          <Upload
            beforeUpload={(file) => {
              setCsvFile(file);
              return false;
            }}
            maxCount={1}
            accept=".csv"
            onRemove={() => setCsvFile(null)}
          >
            <Button icon={<UploadOutlined />} block size="large">
              {csvFile ? `Selected: ${csvFile.name}` : 'Choose CSV File from Computer'}
            </Button>
          </Upload>
        </div>

        <Button
          type="primary"
          block
          size="large"
          loading={importing}
          disabled={!csvFile}
          onClick={handleProcessCSVImport}
          style={{ height: 46, fontWeight: 700 }}
        >
          Import Products into Inventory
        </Button>
      </Modal>
    </div>
  );
}
