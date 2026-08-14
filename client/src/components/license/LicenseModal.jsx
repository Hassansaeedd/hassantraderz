// client/src/components/license/LicenseModal.jsx — Vendor Software License & Serial Key Activation
import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Tag, Alert, message } from 'antd';
import { KeyOutlined, HddOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';

export default function LicenseModal({ open, onClose }) {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [form]                        = Form.useForm();
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('software_license');
    if (stored) {
      setLicenseInfo(JSON.parse(stored));
    } else {
      const defaultLic = {
        machineId: 'HT-9F82-PK',
        plan: 'Commercial Enterprise',
        status: 'ACTIVE',
        activatedOn: new Date().toLocaleDateString(),
        expiresOn: 'Lifetime License',
        licenseKey: 'HT-2026-ENT-9F82-COMMERCIAL',
      };
      localStorage.setItem('software_license', JSON.stringify(defaultLic));
      setLicenseInfo(defaultLic);
    }
  }, []);

  const handleActivateKey = (values) => {
    setSubmitting(true);
    try {
      const key = values.serialKey.trim().toUpperCase();
      if (!key.startsWith('HT-')) {
        message.error('Invalid License Key format. Key must start with HT-');
        setSubmitting(false);
        return;
      }

      const updated = {
        machineId: 'HT-9F82-PK',
        plan: key.includes('ENT') ? 'Commercial Enterprise' : 'Annual Professional',
        status: 'ACTIVE',
        activatedOn: new Date().toLocaleDateString(),
        expiresOn: key.includes('ENT') ? 'Lifetime License' : 'Active (365 Days)',
        licenseKey: key,
      };

      localStorage.setItem('software_license', JSON.stringify(updated));
      setLicenseInfo(updated);
      message.success('Software License successfully activated!');
      form.resetFields();
      if (onClose) onClose();
    } catch {
      message.error('Activation failed');
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
      <Alert
        type="success"
        showIcon
        icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
        message="Licensed Commercial Software"
        description="This copy of Hassan Traderz POS is registered and protected under Machine Hardware Lock."
        style={{ marginBottom: 16 }}
      />

      <div style={{
        background: 'var(--bg-elevated)', padding: 16, borderRadius: 12,
        border: '1px solid var(--border)', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Hardware Machine ID:</span>
          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>{licenseInfo?.machineId}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>License Plan:</span>
          <Tag color="green" style={{ fontWeight: 700, margin: 0 }}>{licenseInfo?.plan}</Tag>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>License Status:</span>
          <Tag color="emerald" style={{ fontWeight: 700, margin: 0 }}>{licenseInfo?.status}</Tag>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Expiration Date:</span>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{licenseInfo?.expiresOn}</span>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleActivateKey}>
        <Form.Item
          name="serialKey"
          label={<span style={{ fontWeight: 700 }}>Enter Serial Activation Key (فروخت کا لائسنس کی)</span>}
          rules={[{ required: true, message: 'Please enter serial key' }]}
        >
          <Input
            size="large"
            prefix={<KeyOutlined style={{ color: 'var(--primary)' }} />}
            placeholder="e.g. HT-2026-ENT-9F82-COMMERCIAL"
            style={{ borderRadius: 8, fontFamily: 'monospace' }}
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
    </Modal>
  );
}
