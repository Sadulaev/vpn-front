import { useState, useEffect } from 'react';
import { Card, Switch, Typography, Spin, message } from 'antd';
import api from '../services/api';

const { Title, Text } = Typography;

interface Settings {
  subscriptionsEnabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Settings>('/auth/settings')
      .then((r) => setSettings(r.data))
      .catch(() => message.error('Не удалось загрузить настройки'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (subscriptionsEnabled: boolean) => {
    setSaving(true);
    try {
      const { data } = await api.put<Settings>('/auth/settings', { subscriptionsEnabled });
      setSettings(data);
      message.success(subscriptionsEnabled ? 'Продажа подписок включена' : 'Продажа подписок отключена');
    } catch {
      message.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '60px auto' }} />;

  return (
    <div style={{ maxWidth: 480 }}>
      <Title level={3}>Настройки</Title>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Продажа подписок</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Разрешить пользователям покупать и продлевать подписки
            </Text>
          </div>
          <Switch
            checked={settings?.subscriptionsEnabled ?? true}
            loading={saving}
            onChange={toggle}
          />
        </div>
      </Card>
    </div>
  );
}
