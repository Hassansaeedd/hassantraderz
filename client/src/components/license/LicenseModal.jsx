// client/src/components/license/LicenseModal.jsx — Live Vendor Software License & Serial Key Activation
import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Tag, Alert, message, Spin } from 'antd';
import { KeyOutlined, SafetyCertificateOutlined, CheckCircleOutlined, ShopOutlined } from '@ant-design/icons';
import api from '../../api/axiosInstance';

export default function LicenseModal({ open, onClose }) {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [form]                        = Form.useForm();
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    if (open) {
      fetchLicenseStatus();
    }
  }, [open]);

  const fetchLicenseStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/licenses/check');
      const data = res.data?.data || res.data || res;
      setLicenseInfo(data);
      localStorage.setItem('software_license', JSON.stringify(data));
    } catch {
      const stored = localStorage.getItem('software_license');
      if (stored) setLicenseInfo(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const handleActivateKey = async (values) => {
    setSubmitting(true);
    try {
      const key = values.serialKey.trim().toUpperCase();
      const res = await api.post('/licenses/activate', {
        licenseKey: key,
        hardwareMachineId: 'HT-WIN-DESKTOP',
      });

      const updated = res.data?.data || res.data || res;
      setLicenseInfo(updated);
      localStorage.setItem('software_license', JSON.stringify(updated));
      message.success(res.message || '🎉 Software License successfully activated!');
      form.resetFields();
      if (onClose) onClose();
    } catch (err) {
      message.error(err?.message || 'Activation failed. Invalid license key.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SafetyCertificateOutlined style={{ color: '#10b981', fontSize: 22 }} />
          <span style={{ fontWeight: 800, fontSize: 18 }}>Software Licensing & Serial Activation</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={540}
    >
      <Spin spinning={loading}>
        <Alert
          type={licenseInfo?.status === 'ACTIVE' ? 'success' : 'warning'}
          showIcon
          icon={<CheckCircleOutlined style={{ color: licenseInfo?.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }} />}
          message={licenseInfo?.status === 'ACTIVE' ? "Licensed Software Copy" : "License Activation Required"}
          description={licenseInfo?.status === 'ACTIVE'
            ? `This POS terminal is activated under ${licenseInfo?.plan || 'Active Subscription'}.`
            : "Please enter your purchased serial license key to unlock unlimited access."}
          style={{ marginBottom: 16 }}
        />

        <div style={{
          background: 'var(--bg-elevated)', padding: 16, borderRadius: 12,
          border: '1px solid var(--border)', marginBottom: 20,
        }}>
          {licenseInfo?.shopName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Registered Shop:</span>
              <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                <ShopOutlined style={{ marginRight: 6, color: 'var(--primary)' }} />
                {licenseInfo.shopName}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>License Plan:</span>
            <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>{licenseInfo?.plan || '15-Day Free Trial'}</Tag>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>License Status:</span>
            <Tag color={licenseInfo?.status === 'ACTIVE' ? 'green' : 'volcano'} style={{ fontWeight: 700, margin: 0 }}>
              {licenseInfo?.status || 'ACTIVE'}
            </Tag>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Time Remaining:</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
              {licenseInfo?.daysRemaining !== undefined
                ? (typeof licenseInfo.daysRemaining === 'number' ? `${licenseInfo.daysRemaining} Days Left` : licenseInfo.daysRemaining)
                : 'Active'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Current Serial Key:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>
              {licenseInfo?.licenseKey || 'HT-TRIAL-AUTO'}
            </span>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleActivateKey}>
          <Form.Item
            name="serialKey"
            label={<span style={{ fontWeight: 700 }}>Enter Serial Activation Key (نیا لائسنس کی درج کریں)</span>}
            rules={[{ required: true, message: 'Please enter serial key' }]}
          >
            <Input
              size="large"
              prefix={<KeyOutlined style={{ color: 'var(--primary)' }} />}
              placeholder="e.g. HT-ANNUAL-365D-A8B9-C1D2 or HT-ENT-LIFETIME-..."
              style={{ borderRadius: 8, fontFamily: 'monospace', textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitting}
            style={{ height: 46, fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
          >
            Activate Serial License Key
          </Button>
        </Form>
      </Spin>
    </Modal>
  );
}
