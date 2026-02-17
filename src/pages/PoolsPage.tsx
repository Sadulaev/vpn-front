import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography, Switch, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { poolsAPI, ServerPool } from '../services/api';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { TextArea } = Input;

const PoolsPage = () => {
  const [pools, setPools] = useState<ServerPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPool, setEditingPool] = useState<ServerPool | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const response = await poolsAPI.getAll();
      setPools(response.data);
    } catch (error) {
      message.error('Ошибка загрузки пулов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPool(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (pool: ServerPool) => {
    setEditingPool(pool);
    form.setFieldsValue(pool);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await poolsAPI.delete(id);
      message.success('Пул удалён');
      fetchPools();
    } catch (error) {
      message.error('Ошибка удаления пула');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingPool) {
        await poolsAPI.update(editingPool.id, values);
        message.success('Пул обновлён');
      } else {
        await poolsAPI.create(values);
        message.success('Пул создан');
      }
      setModalVisible(false);
      fetchPools();
    } catch (error) {
      message.error('Ошибка сохранения пула');
    }
  };

  const columns: ColumnsType<ServerPool> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '—',
    },
    {
      title: 'Серверов',
      dataIndex: 'servers',
      key: 'servers',
      render: (servers) => servers?.length || 0,
    },
    {
      title: 'Активен',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Да' : 'Нет'}
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
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить пул?"
            description="Серверы будут отвязаны от пула"
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
        <Title level={2}>Пулы серверов</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить пул
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={pools}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingPool ? 'Редактировать пул' : 'Добавить пул'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название пула' }]}
          >
            <Input placeholder="Европа, Азия и т.д." />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <TextArea rows={3} placeholder="Описание пула серверов" />
          </Form.Item>
          <Form.Item name="isActive" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PoolsPage;
