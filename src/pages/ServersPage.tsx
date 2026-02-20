import { useState, useEffect, useRef } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, message, Tag, Empty, Spin, Pagination, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { serversAPI, poolsAPI, XuiServer, ServerPool, SyncStatus } from '../services/api';
import { parseVlessKey } from '../utils/vlessParser';

const { TextArea } = Input;

const ServersPage = () => {
  const [servers, setServers] = useState<XuiServer[]>([]);
  const [pools, setPools] = useState<ServerPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<XuiServer | null>(null);
  const [vlessKey, setVlessKey] = useState('');
  const [syncStatuses, setSyncStatuses] = useState<Map<number, SyncStatus>>(new Map());
  const [syncResultModal, setSyncResultModal] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncStatus | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchServers();
    fetchPools();
    
    // Cleanup на размонтировании
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
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
    try {
      // Запускаем синхронизацию
      const response = await serversAPI.sync(serverId);
      const { message: msg } = response.data;
      
      message.info(msg);
      
      // Начинаем опрос статуса
      pollSyncStatus(serverId);
      
      // Запускаем интервал для обновления статуса
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => {
          updateSyncStatuses();
        }, 2000); // Обновляем каждые 2 секунды
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Ошибка запуска синхронизации');
    }
  };

  const handleMigrateEmails = async (serverId: number, serverName: string) => {
    Modal.confirm({
      title: 'Мигрировать email клиентов?',
      content: `Это обновит email всех клиентов на сервере "${serverName}" с формата client-{uuid} на полный UUID. Процесс может занять несколько минут.`,
      okText: 'Мигрировать',
      cancelText: 'Отмена',
      onOk: async () => {
        const hide = message.loading('Миграция в процессе...', 0);
        try {
          const response = await serversAPI.migrateEmails(serverId);
          hide();
          
          Modal.info({
            title: 'Миграция завершена',
            content: (
              <div>
                <div>Всего клиентов: {response.data.total}</div>
                <div style={{ color: '#52c41a' }}>Обновлено: {response.data.updated}</div>
                {response.data.failed > 0 && (
                  <div style={{ color: '#ff4d4f' }}>Ошибок: {response.data.failed}</div>
                )}
                {response.data.errors.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {response.data.errors.slice(0, 5).map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            ),
          });
        } catch (error: any) {
          hide();
          message.error(error.response?.data?.message || 'Ошибка миграции');
        }
      },
    });
  };

  const pollSyncStatus = async (serverId: number) => {
    try {
      const response = await serversAPI.getSyncStatus(serverId);
      const status = response.data;
      
      setSyncStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(serverId, status);
        return newMap;
      });
      
      // Если синхронизация завершена или провалилась, показываем результат
      if (status.status === 'completed' || status.status === 'failed') {
        setSyncResult(status);
        setSyncResultModal(true);
        
        // Удаляем из списка активных
        setSyncStatuses(prev => {
          const newMap = new Map(prev);
          newMap.delete(serverId);
          return newMap;
        });
        
        // Если нет больше активных синхронизаций, останавливаем опрос
        if (syncStatuses.size <= 1) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error('Failed to poll sync status:', error);
    }
  };

  const updateSyncStatuses = async () => {
    const serverIds = Array.from(syncStatuses.keys());
    
    if (serverIds.length === 0) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }
    
    // Обновляем статус каждого активного сервера
    for (const serverId of serverIds) {
      await pollSyncStatus(serverId);
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

                {/* Прогресс синхронизации */}
                {syncStatuses.has(server.id) && (() => {
                  const status = syncStatuses.get(server.id)!;
                  const progress = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;
                  const estimatedSec = status.estimatedTimeMs ? Math.ceil(status.estimatedTimeMs / 1000) : 0;
                  
                  return (
                    <div style={{ marginBottom: 12, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        Синхронизация: {status.processed} / {status.total} клиентов
                        {status.status === 'pending' && ` (ожидаем ~${estimatedSec} сек)`}
                      </div>
                      <Progress 
                        percent={progress} 
                        status={status.status === 'in-progress' ? 'active' : 'normal'}
                        size="small"
                      />
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        Успешно: {status.success} | Ошибки: {status.failed}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button 
                    icon={<SyncOutlined />} 
                    loading={syncStatuses.has(server.id) && syncStatuses.get(server.id)?.status === 'in-progress'} 
                    disabled={syncStatuses.has(server.id)}
                    onClick={() => handleSync(server.id)} 
                    style={{ flex: '1 1 auto' }}
                  >
                    {syncStatuses.has(server.id) ? 'Синхр...' : 'Синхр.'}
                  </Button>
                  <Button 
                    type="dashed"
                    onClick={() => handleMigrateEmails(server.id, server.name)}
                    style={{ flex: '1 1 auto' }}
                  >
                    UUID миграция
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
        title={`Результат синхронизации - ${syncResult?.serverName || ''}`}
        open={syncResultModal}
        onCancel={() => setSyncResultModal(false)}
        footer={<Button type="primary" onClick={() => setSyncResultModal(false)}>OK</Button>}
      >
        {syncResult && (
          <div>
            <div style={{ 
              background: syncResult.status === 'completed' ? '#f6ffed' : '#fff2e8', 
              border: `1px solid ${syncResult.status === 'completed' ? '#b7eb8f' : '#ffbb96'}`, 
              borderRadius: 8, 
              padding: 12,
              marginBottom: 12 
            }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Статус: {syncResult.status === 'completed' ? '✓ Завершено' : '⚠ Завершено с ошибками'}
              </div>
              <div>Всего клиентов: {syncResult.total}</div>
              <div style={{ color: '#52c41a' }}>Успешно добавлено: {syncResult.success}</div>
              {syncResult.failed > 0 && <div style={{ color: '#ff4d4f' }}>Ошибок: {syncResult.failed}</div>}
              
              {syncResult.completedAt && syncResult.startedAt && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                  Время выполнения: {Math.ceil((new Date(syncResult.completedAt).getTime() - new Date(syncResult.startedAt).getTime()) / 1000)} сек
                </div>
              )}
            </div>
            
            {syncResult.error && (
              <div style={{ padding: 12, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 8, fontSize: 12, color: '#ff4d4f' }}>
                <strong>Ошибка:</strong> {syncResult.error}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServersPage;
