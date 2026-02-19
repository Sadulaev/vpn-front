import { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, message, Tag, Empty, Spin, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { serversAPI, poolsAPI, XuiServer, ServerPool } from '../services/api';
import { parseVlessKey } from '../utils/vlessParser';

const { TextArea } = Input;

const ServersPage = () => {
  const [servers, setServers] = useState<XuiServer[]>([]);
  const [pools, setPools] = useState<ServerPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<XuiServer | null>(null);
  const [vlessKey, setVlessKey] = useState('');
  const [syncing, setSyncing] = useState<number | null>(null);
  const [syncResultModal, setSyncResultModal] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
    } catch {
      message.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const fetchPools = async () => {
    try {
      const response = await poolsAPI.getAll();
      setPools(response.data);
    } catch {
      // Silent fail
    }
  };

  const handleCreate = () => {
    setEditingServer(null);
    setVlessKey('');
    form.resetFields();
    form.setFieldsValue({ publicPort: 443, security: 'reality', fp: 'chrome', spx: '/', usersLimit: 100, status: 'active' });
    setModalVisible(true);
  };

  const handleEdit = (server: XuiServer) => {
    setEditingServer(server);
    setVlessKey('');
    form.setFieldsValue(server);
    setModalVisible(true);
  };

  const handleVlessKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const key = e.target.value;
    setVlessKey(key);
    if (key.startsWith('vless://')) {
      const parsed = parseVlessKey(key);
      if (parsed) {
        form.setFieldsValue(parsed);
        message.success('Данные загружены');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await serversAPI.delete(id);
      message.success('Удалено');
      fetchServers();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingServer) {
        await serversAPI.update(editingServer.id, values);
        message.success('Обновлено');
      } else {
        const response = await serversAPI.create(values);
        message.success('Создано');
        if (response.data.syncResult) {
          setSyncResult(response.data.syncResult);
          setSyncResultModal(true);
        }
      }
      setModalVisible(false);
      fetchServers();
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  const handleSync = async (serverId: number) => {
    setSyncing(serverId);
    try {
      const response = await serversAPI.sync(serverId);
      setSyncResult(response.data);
      setSyncResultModal(true);
    } catch {
      message.error('Ошибка синхронизации');
    } finally {
      setSyncing(null);
    }
  };

  const paginatedData = servers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Серверы</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Добавить
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
      ) : servers.length === 0 ? (
        <Empty description="Нет серверов" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginatedData.map((server, index) => (
              <div key={server.id} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ color: '#999', fontSize: 12 }}>#{(page - 1) * pageSize + index + 1}</span>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{server.name}</div>
                    {server.serverPool && (
                      <Tag color="blue" style={{ marginTop: 4 }}>{server.serverPool.name}</Tag>
                    )}
                  </div>
                  <Tag color={server.status === 'active' ? 'green' : 'red'}>
                    {server.status === 'active' ? 'Актив' : 'Неакт'}
                  </Tag>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#666', marginBottom: 12 }}>
                  <div><span style={{ color: '#999' }}>Хост:</span> {server.publicHost}</div>
                  <div><span style={{ color: '#999' }}>Порт:</span> {server.publicPort}</div>
                  <div><span style={{ color: '#999' }}>Лимит:</span> {server.usersLimit}</div>
                  <div><span style={{ color: '#999' }}>Security:</span> {server.security}</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button icon={<SyncOutlined />} loading={syncing === server.id} onClick={() => handleSync(server.id)} style={{ flex: 1 }}>
                    Синхр.
                  </Button>
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(server)} />
                  <Button danger icon={<DeleteOutlined />} onClick={() => {
                    Modal.confirm({
                      title: 'Удалить сервер?',
                      okText: 'Удалить',
                      cancelText: 'Отмена',
                      onOk: () => handleDelete(server.id),
                    });
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={servers.length}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
              size="small"
            />
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingServer ? 'Редактировать' : 'Добавить сервер'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width="95%"
        style={{ maxWidth: 600 }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit} size="small">
            {!editingServer && (
              <Form.Item label="VLESS ключ (автозаполнение)">
                <TextArea
                  placeholder="vless://uuid@host:port?params#name"
                  value={vlessKey}
                  onChange={handleVlessKeyChange}
                  rows={2}
                />
              </Form.Item>
            )}

            <Form.Item name="name" label="Название" rules={[{ required: true }]}>
              <Input placeholder="Germany-1" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="serverPoolId" label="Пул">
                <Select placeholder="Пул" allowClear>
                  {pools.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Статус">
                <Select>
                  <Select.Option value="active">Активен</Select.Option>
                  <Select.Option value="failed">Неактивен</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="apiUrl" label="API URL" rules={[{ required: true }]}>
              <Input placeholder="https://panel.example.com" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="webBasePath" label="Web Path">
                <Input placeholder="dashboard" />
              </Form.Item>
              <Form.Item name="inboundId" label="Inbound ID">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                <Input.Password />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Form.Item name="publicHost" label="Публичный хост" rules={[{ required: true }]}>
                <Input placeholder="vpn.example.com" />
              </Form.Item>
              <Form.Item name="publicPort" label="Порт">
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="security" label="Security">
                <Select>
                  <Select.Option value="reality">reality</Select.Option>
                  <Select.Option value="tls">tls</Select.Option>
                  <Select.Option value="none">none</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="usersLimit" label="Лимит">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item name="pbk" label="Public Key (PBK)" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Form.Item name="sni" label="SNI" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="sid" label="Short ID" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Form.Item name="fp" label="Fingerprint">
                <Select>
                  <Select.Option value="chrome">chrome</Select.Option>
                  <Select.Option value="firefox">firefox</Select.Option>
                  <Select.Option value="safari">safari</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="spx" label="Spider X">
                <Input placeholder="/" />
              </Form.Item>
              <Form.Item name="flow" label="Flow">
                <Input />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Sync Result Modal */}
      <Modal
        title="Результат синхронизации"
        open={syncResultModal}
        onCancel={() => setSyncResultModal(false)}
        footer={<Button type="primary" onClick={() => setSyncResultModal(false)}>OK</Button>}
      >
        {syncResult && (
          <div>
            <div style={{ background: syncResult.failed > 0 ? '#fff7e6' : '#f6ffed', border: `1px solid ${syncResult.failed > 0 ? '#ffd591' : '#b7eb8f'}`, borderRadius: 8, padding: 12 }}>
              <div>Всего: {syncResult.total}</div>
              <div style={{ color: '#52c41a' }}>Успешно: {syncResult.success}</div>
              {syncResult.failed > 0 && <div style={{ color: '#ff4d4f' }}>Ошибок: {syncResult.failed}</div>}
            </div>
            {syncResult.errors?.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#ff4d4f' }}>
                {syncResult.errors.map((e: string, i: number) => <div key={i}>• {e}</div>)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServersPage;
