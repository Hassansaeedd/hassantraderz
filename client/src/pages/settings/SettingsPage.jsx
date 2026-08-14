// client/src/pages/settings/SettingsPage.jsx — Shop Settings & GST Configuration
import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, Typography, Row, Col, Divider, message, Select } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';

const { Title }  = Typography;
const { Option } = Select;

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [form]      = Form.useForm();
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      form.setFieldsValue({
        shop_name:           res.data.shop_name || 'Mobile World',
        shop_name_ur:        res.data.shop_name_ur || 'موبائل ورلڈ',
        shop_address:        res.data.shop_address || 'Main Bazaar, Lahore',
        shop_phone:          res.data.shop_phone || '+92-300-0000000',
        currency:            res.data.currency || 'PKR',
        gst_rate:            Number(res.data.gst_rate || 17),
        ntn:                 res.data.ntn || '',
        strn:                res.data.strn || '',
        receipt_footer_en:   res.data.receipt_footer_en || 'Thank you for shopping!',
        receipt_footer_ur:   res.data.receipt_footer_ur || 'خریداری کا شکریہ!',
      });
    } catch {
      message.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      await api.put('/settings', values);
      message.success('Settings saved successfully!');
    } catch (err) {
      message.error(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <Title level={3} style={{ color: 'var(--text)', marginBottom: 24 }}>{t('settings.title')}</Title>

      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', maxWidth: 800 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} disabled={loading}>
          
          <Divider style={{ borderColor: 'var(--border)' }}>Shop Details</Divider>
          
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="shop_name" label="Shop Name (English)" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="shop_name_ur" label="Shop Name (Urdu)">
                <Input size="large" dir="rtl" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="shop_phone" label="Shop Phone Number">
                <Input size="large" placeholder="+92-300-0000000" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="currency" label="Currency">
                <Select size="large">
                  <Option value="PKR">PKR (₨ - Pakistani Rupee)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="shop_address" label="Shop Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider style={{ borderColor: 'var(--border)' }}>Pakistan Tax & GST Configuration</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="gst_rate" label="Standard GST Rate (%)" rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} suffix="%" min={0} max={100} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="ntn" label="NTN Number">
                <Input size="large" placeholder="1234567-8" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="strn" label="STRN Number">
                <Input size="large" placeholder="1234567890123" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: 'var(--border)' }}>Receipt Footer Message</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="receipt_footer_en" label="Receipt Footer (English)">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="receipt_footer_ur" label="Receipt Footer (Urdu)">
                <Input size="large" dir="rtl" />
              </Form.Item>
            </Col>
          </Row>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            icon={<SaveOutlined />}
            loading={submitting}
            style={{ marginTop: 16, height: 44, padding: '0 32px' }}
          >
            {t('settings.save')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
