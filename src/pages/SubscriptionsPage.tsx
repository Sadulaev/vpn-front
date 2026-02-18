import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Space, Typography, Tag, Tooltip } from 'antd';
import { PlusOutlined, CopyOutlined, CheckCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { subscriptionsAPI, Subscription } from '../services/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await subscriptionsAPI.getAll();
      setSubscriptions(response.data);
    } catch (error) {
      message.error('Ошибка загрузки подписок');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ months: 1 });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const response = await subscriptionsAPI.create(values);
      message.success('Подписка создана');
      console.log('Subscription URL:', response.data);
      setModalVisible(false);
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

  const copySubscriptionUrl = async (id: string) => {
    try {
      const response = await subscriptionsAPI.getUrl(id);
      const url = response.data.data?.subscriptionUrl || response.data.subscriptionUrl;
      copyToClipboard(url);
    } catch (error) {
      message.error('Ошибка получения URL подписки');
    }
  };

  const columns: ColumnsType<Subscription> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
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
      width: 100,
      render: (text: string) => (
        <Tooltip title="Скопировать Client ID">
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
      dataIndex: 'months',
      key: 'months',
      render: (months: number) => `${months} мес.`,
    },
    {
      title: 'Начало',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Окончание',
      dataIndex: 'endDate',
      key: 'endDate',
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
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Tooltip title="Скопировать URL подписки">
          <Button 
            type="primary" 
            ghost
            size="small"
            icon={<LinkOutlined />}
            onClick={() => copySubscriptionUrl(record.id)}
          >
            URL
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Подписки</Title>
        <Space>
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

      <Table
        columns={columns}
        dataSource={subscriptions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
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
            label="Telegram ID"
            rules={[{ required: true, message: 'Введите Telegram ID' }]}
          >
            <Input placeholder="123456789" />
          </Form.Item>
          <Form.Item name="username" label="Username (опционально)">
            <Input placeholder="@username" />
          </Form.Item>
          <Form.Item name="firstName" label="Имя (опционально)">
            <Input placeholder="Иван" />
          </Form.Item>
          <Form.Item
            name="months"
            label="Период (месяцев)"
            rules={[{ required: true, message: 'Укажите период' }]}
          >
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;
