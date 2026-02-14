import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Typography,
  Tooltip,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/services/api';

const { Title, Text, Paragraph } = Typography;

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [changeServerModalVisible, setChangeServerModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [form] = Form.useForm();
  const [extendForm] = Form.useForm();
  const [serverForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsData, usersData, serversData] = await Promise.all([
        api.getSubscriptions(),
        api.getUsers(),
        api.getServers(),
      ]);
      setSubscriptions(subsData);
      setUsers(usersData);
      setServers(serversData);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSubscription(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingSubscription(record);
    form.setFieldsValue({
      ...record,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSubscription(id);
      message.success('Subscription deleted successfully');
      loadData();
    } catch (error) {
      message.error('Failed to delete subscription');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const subscriptionData = {
        ...values,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
      };

      if (editingSubscription) {
        await api.updateSubscription(editingSubscription.id, subscriptionData);
        message.success('Subscription updated successfully');
      } else {
        await api.createSubscription(subscriptionData);
        message.success('Subscription created successfully');
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('Subscription URL copied!');
  };

  const handleExtend = (record: any) => {
    setSelectedSubscription(record);
    extendForm.resetFields();
    setExtendModalVisible(true);
  };

  const handleExtendSubmit = async (values: any) => {
    try {
      await api.extendSubscription(selectedSubscription.id, values.months);
      message.success('Subscription extended successfully');
      setExtendModalVisible(false);
      loadData();
    } catch (error) {
      message.error('Failed to extend subscription');
    }
  };

  const handleChangeServer = (record: any) => {
    setSelectedSubscription(record);
    serverForm.resetFields();
    setChangeServerModalVisible(true);
  };

  const handleChangeServerSubmit = async (values: any) => {
    try {
      await api.changeSubscriptionServer(selectedSubscription.id, values.serverId);
      message.success('Server changed successfully');
      setChangeServerModalVisible(false);
      loadData();
    } catch (error) {
      message.error('Failed to change server');
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => {
        const user = users.find((u: any) => u.id === userId);
        return user ? (
          <Text>{user.firstName || user.username || user.telegramId}</Text>
        ) : (
          userId.slice(0, 8)
        );
      },
    },
    {
      title: 'Server',
      dataIndex: 'serverId',
      key: 'serverId',
      render: (serverId: string) => {
        const server = servers.find((s: any) => s.id === serverId);
        return server ? server.name : 'N/A';
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          expired: 'red',
          suspended: 'orange',
          cancelled: 'default',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Expires At',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Plan',
      dataIndex: 'planName',
      key: 'planName',
      render: (plan: string, record: any) => plan || `${record.periodMonths} month(s)`,
    },
    {
      title: 'Subscription URL',
      dataIndex: 'subscriptionUrl',
      key: 'subscriptionUrl',
      render: (url: string) => (
        <Paragraph
          copyable={{
            text: url,
            tooltips: ['Copy URL', 'Copied!'],
          }}
          style={{ margin: 0, maxWidth: 200 }}
          ellipsis
        >
          {url}
        </Paragraph>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Extend">
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => handleExtend(record)}
            />
          </Tooltip>
          <Tooltip title="Change Server">
            <Button
              type="link"
              icon={<SwapOutlined />}
              onClick={() => handleChangeServer(record)}
            />
          </Tooltip>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete subscription?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Subscriptions</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create Subscription
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={subscriptions}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingSubscription ? 'Edit Subscription' : 'Create Subscription'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="userId"
            label="User"
            rules={[{ required: true, message: 'Please select a user!' }]}
          >
            <Select
              showSearch
              placeholder="Select user"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((user: any) => ({
                value: user.id,
                label: user.firstName || user.username || user.telegramId || user.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="serverId" label="Server (Optional)">
            <Select
              placeholder="Auto-select best server"
              allowClear
              options={servers.map((server: any) => ({
                value: server.id,
                label: server.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="periodMonths"
            label="Period (Months)"
            initialValue={1}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={36} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="planName" label="Plan Name">
            <Input placeholder="Basic / Pro / Premium" />
          </Form.Item>

          <Form.Item name="maxDevices" label="Max Devices" initialValue={1}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="trafficLimit" label="Traffic Limit (Bytes)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          {editingSubscription && (
            <>
              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="expired">Expired</Select.Option>
                  <Select.Option value="suspended">Suspended</Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="expiresAt" label="Expires At">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="Extend Subscription"
        open={extendModalVisible}
        onCancel={() => setExtendModalVisible(false)}
        onOk={() => extendForm.submit()}
      >
        <Form form={extendForm} layout="vertical" onFinish={handleExtendSubmit}>
          <Form.Item
            name="months"
            label="Extend by (Months)"
            initialValue={1}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={36} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Change Server"
        open={changeServerModalVisible}
        onCancel={() => setChangeServerModalVisible(false)}
        onOk={() => serverForm.submit()}
      >
        <Form form={serverForm} layout="vertical" onFinish={handleChangeServerSubmit}>
          <Form.Item
            name="serverId"
            label="New Server"
            rules={[{ required: true, message: 'Please select a server!' }]}
          >
            <Select
              placeholder="Select new server"
              options={servers.map((server: any) => ({
                value: server.id,
                label: `${server.name} (${server.country || 'N/A'})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Subscriptions;
