import { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Switch, message, Tag, Empty, Spin, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { poolsAPI, ServerPool } from '../services/api';

const { TextArea } = Input;

const PoolsPage = () => {
  const [pools, setPools] = useState<ServerPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPool, setEditingPool] = useState<ServerPool | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const response = await poolsAPI.getAll();
      setPools(response.data);
    } catch {
      message.error('Ошибка загрузки');
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
      message.success('Удалено');
      fetchPools();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingPool) {
        await poolsAPI.update(editingPool.id, values);
        message.success('Обновлено');
      } else {
        await poolsAPI.create(values);
        message.success('Создано');
      }
      setModalVisible(false);
      fetchPools();
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  const paginatedData = pools.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Пулы серверов</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : pools.length === 0 ? (
        <Empty description="Нет пулов" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginatedData.map((pool, index) => (
              <div key={pool.id} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ color: '#999', fontSize: 12 }}>#{(page - 1) * pageSize + index + 1}</span>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{pool.name}</div>
                  </div>
                  <Tag color={pool.isActive ? 'green' : 'red'}>
                    {pool.isActive ? 'Активен' : 'Неактивен'}
                  </Tag>
                </div>

                {pool.description && (
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                    {pool.description}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, color: '#999' }}>
                    Серверов: <strong style={{ color: '#333' }}>{pool.servers?.length || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(pool)} />
                    <Button danger icon={<DeleteOutlined />} onClick={() => {
                      Modal.confirm({
                        title: 'Удалить пул?',
                        content: 'Серверы будут отвязаны от пула',
                        okText: 'Удалить',
                        cancelText: 'Отмена',
                        onOk: () => handleDelete(pool.id),
                      });
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pools.length > pageSize && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={pools.length}
                onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
                showSizeChanger
                pageSizeOptions={['10', '20', '50']}
                size="small"
              />
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal
        title={editingPool ? 'Редактировать пул' : 'Добавить пул'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Название" rules={[{ required: true }]}>
            <Input placeholder="Европа, Азия и т.д." />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <TextArea rows={2} placeholder="Описание пула" />
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
