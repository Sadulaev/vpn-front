import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Popconfirm, Space, Typography, Tag, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { serversAPI, poolsAPI, XuiServer, ServerPool } from '../services/api';
import { parseVlessKey } from '../utils/vlessParser';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const ServersPage = () => {
  const [servers, setServers] = useState<XuiServer[]>([]);
  const [pools, setPools] = useState<ServerPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<XuiServer | null>(null);
  const [vlessKey, setVlessKey] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServers();
    fetchPools();
  }, []);

  const fetchServers = async () => {
    setLoading(true);
    try {
      const response = await serversAPI.getAll();
      setServers(response.data);
    } catch (error) {
      message.error('Ошибка загрузки серверов');
    } finally {
      setLoading(false);
    }
  };

  const fetchPools = async () => {
    try {
      const response = await poolsAPI.getAll();
      setPools(response.data);
    } catch (error) {
      message.error('Ошибка загрузки пулов');
    }
  };

  const handleCreate = () => {
    setEditingServer(null);
    setVlessKey('');
    form.resetFields();
    form.setFieldsValue({ 
      publicPort: 443, 
      security: 'reality',
      fp: 'chrome',
      spx: '/',
      usersLimit: 100,
      status: 'active',
    });
    setModalVisible(true);
  };

  const handleEdit = (server: XuiServer) => {
    setEditingServer(server);
    setVlessKey('');
    form.setFieldsValue(server);
    setModalVisible(true);
  };

  const handleVlessKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setVlessKey(key);

    if (key.startsWith('vless://')) {
      const parsed = parseVlessKey(key);
      if (parsed) {
        form.setFieldsValue(parsed);
        message.success('Данные из VLESS ключа загружены');
      } else {
        message.error('Не удалось распарсить VLESS ключ');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await serversAPI.delete(id);
      message.success('Сервер удалён');
      fetchServers();
    } catch (error) {
      message.error('Ошибка удаления сервера');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingServer) {
        await serversAPI.update(editingServer.id, values);
        message.success('Сервер обновлён');
      } else {
        await serversAPI.create(values);
        message.success('Сервер создан');
      }
      setModalVisible(false);
      fetchServers();
    } catch (error) {
      message.error('Ошибка сохранения сервера');
    }
  };

  const columns: ColumnsType<XuiServer> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Пул',
      dataIndex: 'serverPool',
      key: 'serverPool',
      render: (pool) => pool?.name || '—',
    },
    {
      title: 'Публичный хост',
      dataIndex: 'publicHost',
      key: 'publicHost',
    },
    {
      title: 'Порт',
      dataIndex: 'publicPort',
      key: 'publicPort',
    },
    {
      title: 'Лимит',
      dataIndex: 'usersLimit',
      key: 'usersLimit',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'failed' ? 'red' : 'gray'}>
          {status === 'active' ? 'Активен' : status === 'failed' ? 'Неактивен' : status}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить сервер?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Серверы</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить сервер
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={servers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingServer ? 'Редактировать сервер' : 'Добавить сервер'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingServer && (
            <>
              <Alert
                message="Автозаполнение"
                description="Вставьте VLESS ключ для автоматического заполнения полей"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item label="VLESS ключ (опционально)">
                <Input.TextArea
                  placeholder="vless://uuid@host:port?params#name"
                  value={vlessKey}
                  onChange={handleVlessKeyChange}
                  rows={3}
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input placeholder="Germany-1" />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item name="serverPoolId" label="Пул серверов" style={{ width: 200 }}>
              <Select placeholder="Выберите пул" allowClear>
                {pools.map(pool => (
                  <Select.Option key={pool.id} value={pool.id}>
                    {pool.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="status" label="Статус" style={{ width: 150 }}>
              <Select>
                <Select.Option value="active">Активен</Select.Option>
                <Select.Option value="failed">Неактивен</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="apiUrl"
            label="API URL"
            rules={[{ required: true, message: 'Введите API URL' }]}
          >
            <Input placeholder="https://panel.example.com" />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="webBasePath"
              label="Web Base Path"
              style={{ width: 200 }}
            >
              <Input placeholder="dashboard" />
            </Form.Item>

            <Form.Item
              name="inboundId"
              label="Inbound ID"
              style={{ width: 150 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true }]}
              style={{ width: 200 }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true }]}
              style={{ width: 200 }}
            >
              <Input.Password />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="publicHost"
              label="Публичный хост"
              rules={[{ required: true }]}
              style={{ width: 300 }}
            >
              <Input placeholder="vpn.example.com" />
            </Form.Item>

            <Form.Item name="publicPort" label="Порт" style={{ width: 120 }}>
              <InputNumber min={1} max={65535} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="security" label="Security" style={{ width: 150 }}>
              <Select>
                <Select.Option value="reality">reality</Select.Option>
                <Select.Option value="tls">tls</Select.Option>
                <Select.Option value="none">none</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="pbk"
            label="Public Key (PBK)"
            rules={[{ required: true }]}
          >
            <Input placeholder="SX7Jyungg..." />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="sni"
              label="SNI"
              rules={[{ required: true }]}
              style={{ width: 300 }}
            >
              <Input placeholder="sni.example.com" />
            </Form.Item>

            <Form.Item
              name="sid"
              label="Short ID"
              rules={[{ required: true }]}
              style={{ width: 150 }}
            >
              <Input placeholder="6ba85179e30d4fc2" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }}>
            <Form.Item name="fp" label="Fingerprint" style={{ width: 150 }}>
              <Select>
                <Select.Option value="chrome">chrome</Select.Option>
                <Select.Option value="firefox">firefox</Select.Option>
                <Select.Option value="safari">safari</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="spx" label="Spider X" style={{ width: 100 }}>
              <Input placeholder="/" />
            </Form.Item>

            <Form.Item name="usersLimit" label="Лимит пользователей" style={{ width: 150 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="flow" label="Flow (опционально)">
            <Input placeholder="xtls-rprx-vision" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServersPage;
