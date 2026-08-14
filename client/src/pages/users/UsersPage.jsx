// client/src/pages/users/UsersPage.jsx — Admin User Management & Roles
import { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Modal, Form, Select, Typography, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, UserOutlined, KeyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';

const { Option } = Select;
const { Title }  = Typography;

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form]                      = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || res.data || []);
    } catch {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      await api.post('/users', values);
      message.success('User account created successfully');
      setModalVisible(false);
      fetchUsers();
    } catch (err) {
      message.error(err?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('User deactivated');
      fetchUsers();
    } catch (err) {
      message.error(err?.message || 'Action failed');
    }
  };

  const columns = [
    { title: 'Full Name', dataIndex: 'fullName', key: 'name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: 'Username', dataIndex: 'username', key: 'username', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Role', dataIndex: 'role', key: 'role', render: v => <Tag color={v === 'ADMIN' ? 'red' : v === 'MANAGER' ? 'purple' : 'green'}>{v}</Tag> },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: v => v || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: v => <Tag color={v === 'ACTIVE' ? 'green' : 'red'}>{v}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: r => (
        <Popconfirm title="Deactivate user?" onConfirm={() => handleDeactivate(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Deactivate</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ color: 'var(--text)', margin: 0 }}>{t('nav.users')}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
          Add User Account
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        style={{ background: 'var(--bg-container)', border: '1px solid var(--border)', borderRadius: 8 }}
      />

      <Modal
        title="Add Staff User Account"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true, min: 3 }]}>
            <Input size="large" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="CASHIER">Cashier (Front desk counter)</Option>
              <Option value="MANAGER">Manager (Inventory & Stock)</Option>
              <Option value="ADMIN">Admin (Full shop access)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
            Create User
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
