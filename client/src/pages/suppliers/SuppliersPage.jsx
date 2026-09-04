// client/src/pages/suppliers/SuppliersPage.jsx — Supplier Vendor Directory
import { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Modal, Form, Typography, Space, message, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';

const { Title } = Typography;

export default function SuppliersPage() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form]                      = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async (q = search) => {
    setLoading(true);
    try {
      let url = '/suppliers';
      if (q) url += `?search=${encodeURIComponent(q)}`;
      const res = await api.get(url);
      setSuppliers(res.data.data || res.data || []);
    } catch {
      message.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingSupplier(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, values);
        message.success('Supplier updated');
      } else {
        await api.post('/suppliers', values);
        message.success('Supplier added');
      }
      setModalVisible(false);
      fetchSuppliers();
    } catch (err) {
      message.error(err?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Contact Person', dataIndex: 'name', key: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Company Name', dataIndex: 'company', key: 'company', render: v => v || '-' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: v => v || '-' },
    { title: 'NTN (Tax #)', dataIndex: 'ntn', key: 'ntn', render: v => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: 'STRN', dataIndex: 'strn', key: 'strn', render: v => v ? <Tag color="cyan">{v}</Tag> : '-' },
    {
      title: 'Actions',
      key: 'actions',
      render: r => <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(r)} />,
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>{t('suppliers.title')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd} style={{ fontWeight: 700 }}>
          {t('suppliers.add')}
        </Button>
      </div>

      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          placeholder="Search supplier by name or company..."
          value={search}
          onChange={e => { setSearch(e.target.value); fetchSuppliers(e.target.value); }}
          style={{ maxWidth: 400, width: '100%' }}
          allowClear
        />
      </Card>

      <Table
        dataSource={suppliers}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
      />

      <Modal
        title={editingSupplier ? 'Edit Supplier' : t('suppliers.add')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Contact Person Name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="company" label="Company / Business Name">
            <Input size="large" placeholder="e.g. Samsung Pakistan Official Distributor" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input size="large" type="email" />
          </Form.Item>
          <Form.Item name="ntn" label="NTN (National Tax Number)">
            <Input size="large" placeholder="1234567-8" />
          </Form.Item>
          <Form.Item name="strn" label="STRN (Sales Tax Reg Number)">
            <Input size="large" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
            {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
