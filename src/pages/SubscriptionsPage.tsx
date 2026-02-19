import { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, InputNumber, message, Tag, Select, Empty, Spin, Pagination } from 'antd';
import { PlusOutlined, CopyOutlined, LinkOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { subscriptionsAPI, Subscription } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('admin');
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSubscriptions();
  }, [searchValue, sourceFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchValue) params.search = searchValue;
      if (sourceFilter) params.source = sourceFilter;
      const response = await subscriptionsAPI.getAll(params);
      setSubscriptions(response.data);
    } catch {
      message.error('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ days: 30 });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const response = await subscriptionsAPI.create(values);
      setCreationResult(response.data);
      setModalVisible(false);
      setResultModalVisible(true);
      message.success('Подписка создана');
      fetchSubscriptions();
    } catch {
      message.error('Ошибка создания');
    }
  };

  const handleProcessExpired = async () => {
    setProcessLoading(true);
    try {
      const response = await subscriptionsAPI.processExpired();
      const data = response.data.data || response.data;
      message.success(`Обработано: ${data.expired} истёкших`);
      fetchSubscriptions();
    } catch {
      message.error('Ошибка обработки');
    } finally {
      setProcessLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Скопировано');
  };

  const showSubscriptionUrl = async (id: string) => {
    try {
      const response = await subscriptionsAPI.getUrl(id);
      setSubscriptionUrl(response.data.data.subscriptionUrl);
      setUrlModalVisible(true);
    } catch {
      message.error('Ошибка получения URL');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await subscriptionsAPI.delete(id);
      message.success('Удалено');
      fetchSubscriptions();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const paginatedData = subscriptions.slice((page - 1) * pageSize, page * pageSize);

  const getStatusColor = (status: string) => {
    if (status === 'active') return '#52c41a';
    if (status === 'expired') return '#ff4d4f';
    return '#999';
  };

  const getStatusText = (status: string) => {
    if (status === 'active') return 'Активна';
    if (status === 'expired') return 'Истекла';
    return status;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Подписки</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Создать
          </Button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="Поиск..."
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ flex: 1, minWidth: 150, maxWidth: 300 }}
            allowClear
          />
          <Select
            value={sourceFilter}
            onChange={setSourceFilter}
            style={{ width: 100 }}
            allowClear
            placeholder="Все"
          >
            <Select.Option value="admin">Админ</Select.Option>
            <Select.Option value="bot">Бот</Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} loading={processLoading} onClick={handleProcessExpired}>
            Истёкшие
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : subscriptions.length === 0 ? (
        <Empty description="Нет подписок" />
      ) : (
        <>
          {/* Card List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginatedData.map((sub, index) => (
              <div
                key={sub.id}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ color: '#999', fontSize: 12 }}>#{(page - 1) * pageSize + index + 1}</span>
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>
                      {sub.clientId.slice(0, 12)}...
                      <CopyOutlined
                        style={{ marginLeft: 8, color: '#667eea', cursor: 'pointer' }}
                        onClick={() => copyToClipboard(sub.clientId)}
                      />
                    </div>
                  </div>
                  <Tag color={getStatusColor(sub.status)} style={{ margin: 0 }}>
                    {getStatusText(sub.status)}
                  </Tag>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: '#666', marginBottom: 12 }}>
                  <div>
                    <span style={{ color: '#999' }}>Период:</span>{' '}
                    <strong>{sub.days} дн.</strong>
                  </div>
                  <div>
                    <span style={{ color: '#999' }}>До:</span>{' '}
                    <strong style={{ color: dayjs(sub.endDate).isBefore(dayjs()) ? '#ff4d4f' : undefined }}>
                      {dayjs(sub.endDate).format('DD.MM.YY')}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#999' }}>Источник:</span>{' '}
                    <Tag color={sub.source === 'admin' ? 'blue' : 'green'} style={{ marginLeft: 4 }}>
                      {sub.source === 'admin' ? 'Админ' : 'Бот'}
                    </Tag>
                  </div>
                  <div>
                    <span style={{ color: '#999' }}>Создан:</span>{' '}
                    {dayjs(sub.createdAt).format('DD.MM.YY')}
                  </div>
                </div>

                {sub.note && (
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 12, padding: '8px', background: '#f9f9f9', borderRadius: 6 }}>
                    {sub.note}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    onClick={() => showSubscriptionUrl(sub.id)}
                    style={{ flex: 1 }}
                  >
                    URL
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Удалить подписку?',
                        content: 'Клиент будет удален со всех серверов',
                        okText: 'Удалить',
                        cancelText: 'Отмена',
                        onOk: () => handleDelete(sub.id),
                      });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={subscriptions.length}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
              size="small"
              showTotal={(total) => `${total} шт.`}
            />
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal
        title="Новая подписка"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="telegramId" label="Telegram ID">
            <Input placeholder="123456789" />
          </Form.Item>
          <Form.Item name="days" label="Период (дней)" rules={[{ required: true }]}>
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Примечание">
            <TextArea rows={2} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* Result Modal */}
      <Modal
        title="Подписка создана"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={<Button type="primary" onClick={() => setResultModalVisible(false)}>OK</Button>}
      >
        {creationResult && (
          <div>
            <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div><strong>Client ID:</strong> {creationResult.subscription?.clientId}</div>
              <div><strong>До:</strong> {dayjs(creationResult.subscription?.endDate).format('DD.MM.YYYY')}</div>
            </div>
            <div style={{ fontSize: 13 }}>
              <div>Серверов: {creationResult.serversTotal}</div>
              <div style={{ color: '#52c41a' }}>Успешно: {creationResult.serversSuccess}</div>
              {creationResult.serversFailed > 0 && (
                <div style={{ color: '#ff4d4f' }}>Ошибок: {creationResult.serversFailed}</div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* URL Modal */}
      <Modal
        title="URL подписки"
        open={urlModalVisible}
        onCancel={() => setUrlModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setUrlModalVisible(false)}>Закрыть</Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => copyToClipboard(subscriptionUrl)}>
            Копировать
          </Button>,
        ]}
      >
        <TextArea
          value={subscriptionUrl}
          readOnly
          autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ fontFamily: 'monospace', fontSize: 11 }}
        />
        <div style={{ marginTop: 12, padding: 12, background: '#e6f7ff', borderRadius: 8, fontSize: 12 }}>
          Отправьте эту ссылку пользователю для добавления в v2ray приложение
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;
