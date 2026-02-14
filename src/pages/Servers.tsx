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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@/services/api';

const { Title } = Typography;
const { TextArea } = Input;

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    try {
      const data = await api.getServers();
      setServers(data);
    } catch (error) {
      message.error('Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingServer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingServer(record);
    form.setFieldsValue({
      ...record,
      settings: record.settings ? JSON.stringify(record.settings, null, 2) : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteServer(id);
      message.success('Server deleted successfully');
      loadServers();
    } catch (error) {
      message.error('Failed to delete server');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const serverData = {
        ...values,
        settings: values.settings ? JSON.parse(values.settings) : null,
      };

      if (editingServer) {
        await api.updateServer(editingServer.id, serverData);
        message.success('Server updated successfully');
      } else {
        await api.createServer(serverData);
        message.success('Server created successfully');
      }

      setModalVisible(false);
      loadServers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Host',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: 'Port',
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol: string) => (
        <Tag color="blue">{protocol.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      render: (country: string, record: any) =>
        country ? `${record.countryCode} - ${country}` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'inactive' ? 'red' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Load',
      dataIndex: 'currentLoad',
      key: 'currentLoad',
      render: (load: number, record: any) => `${load}/${record.maxCapacity}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete server?"
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
        <Title level={2}>Servers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Server
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={servers}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingServer ? 'Edit Server' : 'Create Server'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input server name!' }]}
          >
            <Input placeholder="US Server 1" />
          </Form.Item>

          <Form.Item
            name="host"
            label="Host"
            rules={[{ required: true, message: 'Please input server host!' }]}
          >
            <Input placeholder="us1.example.com" />
          </Form.Item>

          <Form.Item
            name="port"
            label="Port"
            rules={[{ required: true, message: 'Please input server port!' }]}
          >
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="protocol" label="Protocol" initialValue="vless">
            <Select>
              <Select.Option value="vless">VLESS</Select.Option>
              <Select.Option value="vmess">VMess</Select.Option>
              <Select.Option value="trojan">Trojan</Select.Option>
              <Select.Option value="shadowsocks">Shadowsocks</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="uuid" label="UUID">
            <Input placeholder="UUID for authentication" />
          </Form.Item>

          <Form.Item name="country" label="Country">
            <Input placeholder="United States" />
          </Form.Item>

          <Form.Item name="countryCode" label="Country Code">
            <Input placeholder="US" maxLength={10} />
          </Form.Item>

          <Form.Item name="city" label="City">
            <Input placeholder="New York" />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="maintenance">Maintenance</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="maxCapacity" label="Max Capacity" initialValue={100}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="priority" label="Priority" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="settings"
            label="Settings (JSON)"
            help="Additional server settings in JSON format"
          >
            <TextArea
              rows={6}
              placeholder={'{\n  "security": "reality",\n  "sni": "www.google.com"\n}'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Servers;
