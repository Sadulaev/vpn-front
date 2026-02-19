import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Typography, Tag, Tooltip, Popconfirm, Select, Alert } from 'antd';
import { PlusOutlined, CopyOutlined, CheckCircleOutlined, LinkOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { subscriptionsAPI, Subscription } from '../services/api';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'admin' | 'bot' | undefined>('admin');
  const [creationResult, setCreationResult] = useState<any>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total) => `Всего: ${total}`,
    pageSizeOptions: ['10', '20', '50', '100'],
  });
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
    } catch (error) {
      message.error('Ошибка загрузки подписок');
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
    } catch (error) {
      message.error('Ошибка создания подписки');
    }
  };

  const handleProcessExpired = async () => {
    setProcessLoading(true);
    try {
      const response = await subscriptionsAPI.processExpired();
      const data = response.data.data || response.data;
      message.success(`Обработано: ${data.expired} истёкших подписок, ${data.clientsRemoved?.length || 0} клиентов удалено`);
      fetchSubscriptions();
    } catch (error) {
      message.error('Ошибка обработки истёкших подписок');
    } finally {
      setProcessLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Скопировано в буфер обмена');
  };

  const showSubscriptionUrl = async (id: string) => {
    try {
      const response = await subscriptionsAPI.getUrl(id);
      const url = response.data.data.subscriptionUrl;
      setSubscriptionUrl(url);
      setUrlModalVisible(true);
    } catch (error) {
      message.error('Ошибка получения URL подписки');
    }
  };

  const handleCopyUrl = () => {
    copyToClipboard(subscriptionUrl);
  };

  const handleDelete = async (id: string) => {
    try {
      await subscriptionsAPI.delete(id);
      message.success('Подписка удалена');
      fetchSubscriptions();
    } catch (error) {
      message.error('Ошибка удаления подписки');
    }
  };

  const columns: ColumnsType<Subscription> = [
    {
      title: '№',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_: any, __: any, index: number) => {
        const current = pagination.current || 1;
        const pageSize = pagination.pageSize || 20;
        return (current - 1) * pageSize + index + 1;
      },
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      responsive: ['md'] as any,
      render: (text: string) => (
        <Tooltip title="Скопировать ID">
          <Button 
            type="link" 
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(text)}
          >
            {text.slice(0, 8)}...
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title="Скопировать Client ID">
          <Button 
            type="link" 
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(text)}
            style={{ padding: 0 }}
          >
            {text.slice(0, 8)}...
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Примечание',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      responsive: ['lg'] as any,
      render: (text: string) => text || '-',
    },
    {
      title: 'Источник',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      responsive: ['md'] as any,
      render: (source: string) => (
        <Tag color={source === 'admin' ? 'blue' : 'green'}>
          {source === 'admin' ? 'Админ' : 'Бот'}
        </Tag>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'active' ? 'green' : 
          status === 'expired' ? 'red' : 
          'gray'
        }>
          {status === 'active' ? 'Активна' : 
           status === 'expired' ? 'Истекла' : 
           status}
        </Tag>
      ),
    },
    {
      title: 'Период',
      dataIndex: 'days',
      key: 'days',
      width: 90,
      responsive: ['lg'] as any,
      render: (days: number) => `${days} дн.`,
    },
    {
      title: 'Начало',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
      responsive: ['xl'] as any,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Окончание',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 110,
      render: (date: string) => {
        const endDate = dayjs(date);
        const isExpired = endDate.isBefore(dayjs());
        return (
          <span style={{ color: isExpired ? 'red' : undefined }}>
            {endDate.format('DD.MM.YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Создана',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      responsive: ['lg'] as any,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="Показать URL подписки">
            <Button 
              type="primary" 
              ghost
              size="small"
              icon={<LinkOutlined />}
              onClick={() => showSubscriptionUrl(record.id)}
            >
              URL
            </Button>
          </Tooltip>
          <Popconfirm
            title="Удалить подписку?"
            description="Клиент будет удален со всех серверов (если нет других активных подписок)"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: 16 
      }}>
        <Title level={2} style={{ margin: 0 }}>Подписки</Title>
        <Space wrap>
          <Button 
            icon={<CheckCircleOutlined />}
            onClick={handleProcessExpired}
            loading={processLoading}
          >
            Обработать истёкшие
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            Создать подписку
          </Button>
        </Space>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Поиск по Client ID или примечанию"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ width: '100%', maxWidth: 300, minWidth: 200 }}
          allowClear
        />
        <Select
          placeholder="Источник"
          value={sourceFilter}
          onChange={setSourceFilter}
          style={{ width: 150 }}
          allowClear
        >
          <Select.Option value="admin">Админ</Select.Option>
          <Select.Option value="bot">Бот</Select.Option>
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={subscriptions}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(newPagination) => setPagination(newPagination)}
        scroll={{ x: 900 }}
        size="small"
        sticky
      />

      <Modal
        title="Создать подписку"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="telegramId"
            label="Telegram ID (опционально)"
          >
            <Input placeholder="123456789" />
          </Form.Item>
          <Form.Item
            name="days"
            label="Период (дней)"
            rules={[{ required: true, message: 'Укажите период' }]}
          >
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="note"
            label="Примечание (опционально)"
          >
            <TextArea 
              rows={3} 
              placeholder="Например: тестовая подписка для клиента Иван..." 
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Результат создания подписки"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setResultModalVisible(false)}>
            Закрыть
          </Button>
        ]}
      >
        {creationResult && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message={`Подписка успешно создана`}
              description={
                <>
                  <p><strong>Client ID:</strong> {creationResult.subscription?.clientId}</p>
                  <p><strong>Подписка до:</strong> {dayjs(creationResult.subscription?.endDate).format('DD.MM.YYYY')}</p>
                </>
              }
              type="success"
              showIcon
            />
            
            <Alert
              message="Добавление на серверы"
              description={
                <>
                  <p>Всего серверов: {creationResult.serversTotal}</p>
                  <p style={{ color: 'green' }}>Успешно добавлено: {creationResult.serversSuccess}</p>
                  <p style={{ color: 'red' }}>Ошибок: {creationResult.serversFailed}</p>
                </>
              }
              type="info"
              showIcon
            />

            {creationResult.successServers && creationResult.successServers.length > 0 && (
              <div>
                <strong>Успешно добавлено на серверы:</strong>
                <ul style={{ marginTop: 8 }}>
                  {creationResult.successServers.map((server: any) => (
                    <li key={server.id}>{server.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {creationResult.failedServers && creationResult.failedServers.length > 0 && (
              <div>
                <strong style={{ color: 'red' }}>Не удалось добавить на серверы:</strong>
                <ul style={{ marginTop: 8 }}>
                  {creationResult.failedServers.map((server: any) => (
                    <li key={server.id} style={{ color: 'red' }}>
                      {server.name}: {server.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Space>
        )}
      </Modal>

      <Modal
        title="URL подписки"
        open={urlModalVisible}
        onCancel={() => setUrlModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setUrlModalVisible(false)}>
            Закрыть
          </Button>,
          <Button 
            key="copy" 
            type="primary" 
            icon={<CopyOutlined />}
            onClick={handleCopyUrl}
          >
            Копировать
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            value={subscriptionUrl}
            readOnly
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <Alert
            message="Скопируйте эту ссылку и отправьте пользователю"
            description="Пользователь должен добавить эту ссылку в приложение v2ray как subscription URL"
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;
