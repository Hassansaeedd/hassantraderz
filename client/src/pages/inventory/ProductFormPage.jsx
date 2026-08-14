// client/src/pages/inventory/ProductFormPage.jsx — Add/Edit Product
import { useState, useEffect } from 'react';
import {
  Form, Input, InputNumber, Select, Button, Card, Row, Col,
  Switch, Upload, message, Typography, Divider, Space
} from 'antd';
import { UploadOutlined, ArrowLeftOutlined, BarcodeOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { generateSKU } from '../../utils/formatters';

const { Option } = Select;
const { Title }  = Typography;

export default function ProductFormPage() {
  const { t }       = useTranslation();
  const navigate    = useNavigate();
  const { id }      = useParams();
  const isEdit      = Boolean(id);

  const [form]       = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList]     = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    if (isEdit) fetchProduct();
    else form.setFieldsValue({ sku: generateSKU('MOB'), gstRate: 17, minStockLevel: 5 });
  }, [id]);

  const fetchCategories = async () => {
    try { const res = await api.get('/categories'); setCategories(res.data || []); } catch {}
  };

  const fetchBrands = async () => {
    try { const res = await api.get('/brands'); setBrands(res.data || []); } catch {}
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      const p = res.data;
      form.setFieldsValue({
        ...p,
        purchasePrice: Number(p.purchasePrice),
        sellingPrice: Number(p.sellingPrice),
        gstRate: Number(p.gstRate),
      });
      if (p.image) setFileList([{ uid: '-1', name: 'current_image.png', status: 'done', url: p.image }]);
    } catch (err) {
      message.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      let productId = id;
      if (isEdit) {
        await api.put(`/products/${id}`, values);
        message.success('Product updated successfully');
      } else {
        const res = await api.post('/products', values);
        productId = res.data.id;
        message.success('Product created successfully');
      }

      // Upload image if selected
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const formData = new FormData();
        formData.append('image', fileList[0].originFileObj);
        await api.post(`/products/${productId}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/products');
    } catch (err) {
      message.error(err?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')} />
        <Title level={3} style={{ color: 'var(--text)', margin: 0 }}>
          {isEdit ? t('products.edit') : t('products.add')}
        </Title>
      </div>

      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', maxWidth: 800 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="nameEn" label={t('products.nameEn')} rules={[{ required: true }]}>
                <Input placeholder="e.g. Samsung Galaxy S24 Ultra" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nameUr" label={t('products.nameUr')}>
                <Input placeholder="مثلاً: سیمسنگ گلیکسی ایس 24 الٹرا" size="large" dir="rtl" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="sku" label={t('products.sku')} rules={[{ required: true }]}>
                <Input
                  size="large"
                  suffix={
                    <Button type="text" size="small" onClick={() => form.setFieldValue('sku', generateSKU('MOB'))}>
                      Auto
                    </Button>
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="barcode" label={t('products.barcode')}>
                <Input size="large" prefix={<BarcodeOutlined />} placeholder="Scan barcode or enter manually" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="categoryId" label={t('products.category')} rules={[{ required: true }]}>
                <Select size="large" placeholder="Select Category">
                  {categories.map(c => <Option key={c.id} value={c.id}>{c.nameEn}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="brandId" label={t('products.brand')}>
                <Select size="large" placeholder="Select Brand" allowClear>
                  {brands.map(b => <Option key={b.id} value={b.id}>{b.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'var(--border)' }}>Pricing & Tax (Pakistan GST)</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="purchasePrice" label={t('products.purchasePrice')} rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="sellingPrice" label={t('products.sellingPrice')} rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} prefix="₨" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="gstRate" label="GST Rate (%)" rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} suffix="%" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="minStockLevel" label={t('products.minStock')}>
                <InputNumber size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label={t('products.image')}>
                <Upload
                  fileList={fileList}
                  beforeUpload={() => false}
                  onChange={({ fileList }) => setFileList(fileList)}
                  maxCount={1}
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />}>Select Image (JPEG/PNG)</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" size="large" loading={submitting}>
              {isEdit ? 'Update Product' : 'Create Product'}
            </Button>
            <Button size="large" onClick={() => navigate('/products')}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
