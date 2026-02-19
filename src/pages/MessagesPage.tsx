import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Statistic, Row, Col } from 'antd';
import { SendOutlined, UserOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { subscriptionsAPI } from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface SendResult {
  sent: number;
  failed: number;
  errors: string[];
}

export default function MessagesPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SendResult | null>(null);

  const handleSend = async (values: { message: string; telegramId?: string }) => {
    setLoading(true);
    setLastResult(null);

    try {
      const response = await subscriptionsAPI.sendMessage({
        message: values.message,
        telegramId: values.telegramId?.trim() || undefined,
      });

      if (response.data.success) {
        // Если это массовая рассылка - приходит message
        if (response.data.message) {
          message.success(
            'Массовая рассылка запущена! Проверьте логи сервера для просмотра результатов.',
            10
          );
          form.resetFields(['message', 'telegramId']);
        } else {
          // Одиночное сообщение - приходит data
          const result = response.data.data;
          
          if (result) {
            setLastResult(result);

            if (result.failed === 0) {
              message.success(`Сообщение успешно отправлено!`);
              form.resetFields(['message', 'telegramId']);
            } else {
              message.error('Не удалось отправить сообщение');
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      message.error(error.response?.data?.message || 'Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <Title level={2}>Отправка сообщений</Title>
      <Text type="secondary">
        Отправляйте сообщения через Telegram бота одному пользователю или всем из Google Sheets (в фоновом режиме)
      </Text>

      <Card style={{ marginTop: '24px', maxWidth: '800px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSend}
        >
          <Form.Item
            label="Сообщение"
            name="message"
            rules={[{ required: true, message: 'Введите сообщение' }]}
          >
            <TextArea
              rows={6}
              placeholder="Введите текст сообщения (поддерживается HTML-форматирование)"
              showCount
              maxLength={4096}
            />
          </Form.Item>

          <Form.Item
            label="Telegram ID"
            name="telegramId"
            extra="Оставьте пустым для массовой рассылки всем из Google Sheets (колонка A). Результаты будут в логах сервера."
          >
            <Input
              placeholder="Опционально: ID конкретного пользователя"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
              >
                Отправить
              </Button>
              <Button
                onClick={() => form.resetFields()}
                disabled={loading}
              >
                Очистить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {lastResult && (
        <Card style={{ marginTop: '24px', maxWidth: '800px' }} title="Результат отправки">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Отправлено"
                value={lastResult.sent}
                valueStyle={{ color: '#3f8600' }}
                prefix={<UsergroupAddOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Ошибок"
                value={lastResult.failed}
                valueStyle={{ color: lastResult.failed > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Col>
          </Row>

          {lastResult.errors.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Title level={5}>Ошибки:</Title>
              <ul>
                {lastResult.errors.map((error, index) => (
                  <li key={index}>
                    <Text type="danger">{error}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
