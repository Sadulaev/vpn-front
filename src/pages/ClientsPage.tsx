import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { clientsAPI, Client } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data);
    } catch (error) {
      message.error('Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingClient(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.setFieldsValue(client);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await clientsAPI.delete(id);
      message.success('Клиент удалён');
      fetchClients();
    } catch (error) {
      message.error('Ошибка удаления клиента');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient.id, values);
        message.success('Клиент обновлён');
      } else {
        await clientsAPI.create(values);
        message.success('Клиент создан');
      }
      setModalVisible(false);
      fetchClients();
    } catch (error) {
      message.error('Ошибка сохранения клиента');
    }
  };

  const columns: ColumnsType<Client> = [
    {
      title: 'Telegram ID',
      dataIndex: 'telegramId',
      key: 'telegramId',
    },
    {
      title: 'Имя пользователя',
      dataIndex: 'username',
      key: 'username',
      render: (text) => text || '—',
    },
    {
      title: 'Имя',
      dataIndex: 'firstName',
      key: 'firstName',
      render: (text) => text || '—',
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('ru-RU'),
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
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить клиента?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />}>
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
        <Title level={2}>Клиенты</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить клиента
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="telegramId"
            label="Telegram ID"
            rules={[{ required: true, message: 'Введите Telegram ID' }]}
          >
            <Input disabled={!!editingClient} />
          </Form.Item>
          <Form.Item name="username" label="Имя пользователя">
            <Input />
          </Form.Item>
          <Form.Item name="firstName" label="Имя">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientsPage;
