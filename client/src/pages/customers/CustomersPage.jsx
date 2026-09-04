// client/src/pages/customers/CustomersPage.jsx — Customer Directory (Fixed Data Mapping)
import { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Modal, Form, Typography, Space, message, Tag
} from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { formatCurrency } from '../../utils/formatters';

const { Title, Text } = Typography;

export default function CustomersPage() {
  const { t } = useTranslation();
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form]                      = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (q = search) => {
    setLoading(true);
    try {
      let url = '/customers';
      if (q) url += `?search=${encodeURIComponent(q)}`;
      const res = await api.get(url);
      setCustomers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch {
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEdit = (record) => {
    setEditingCustomer(record);
    form.setFieldsValue({
      ...record,
      creditLimit: Number(record.creditLimit),
    });
    setModalVisible(true);
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, values);
        message.success('Customer updated');
      } else {
        await api.post('/customers', values);
        message.success('Customer added');
      }
      setModalVisible(false);
      fetchCustomers();
    } catch (err) {
      message.error(err?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: v => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: v => v || '-' },
    { title: 'City', dataIndex: 'city', key: 'city', render: v => v || '-' },
    { title: 'Outstanding Balance', dataIndex: 'outstandingBalance', key: 'balance', render: v => <Tag color={Number(v) > 0 ? 'red' : 'green'}>{formatCurrency(v)}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: r => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(r)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ color: 'var(--text)', margin: 0, fontWeight: 800 }}>
            <TeamOutlined style={{ color: 'var(--primary)', marginRight: 10 }} />
            {t('customers.title')}
          </Title>
          <Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Customer directory, contact numbers, and outstanding balance tracking
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd} style={{ fontWeight: 700 }}>
          {t('customers.add')}
        </Button>
      </div>

      <Card style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          placeholder="Search customer by name or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); fetchCustomers(e.target.value); }}
          style={{ maxWidth: 400, width: '100%' }}
          allowClear
        />
      </Card>

      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
      />

      <Modal
        title={editingCustomer ? 'Edit Customer' : t('customers.add')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Customer Name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input size="large" placeholder="03001234567" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input size="large" type="email" />
          </Form.Item>
          <Form.Item name="city" label="City">
            <Input size="large" placeholder="e.g. Lahore, Karachi" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="creditLimit" label="Credit Limit (₨)">
            <Input size="large" type="number" defaultValue={0} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
            {editingCustomer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
