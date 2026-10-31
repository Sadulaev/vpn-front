import { useState, useEffect } from 'react';
import { Card, Switch, Typography, Spin, message, Input, Button, Divider, Space } from 'antd';
import api from '../services/api';

const { Title, Text } = Typography;

interface Settings {
  standardEnabled: boolean;
  antiThrottlingEnabled: boolean;
  supportUrl: string;
  supportHandle: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [supportDraft, setSupportDraft] = useState('');

  useEffect(() => {
    api.get<Settings>('/auth/settings')
      .then((r) => {
        setSettings(r.data);
        setSupportDraft(r.data.supportUrl || '');
      })
      .catch(() => message.error('Не удалось загрузить настройки'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: 'standardEnabled' | 'antiThrottlingEnabled', value: boolean) => {
    setSaving(key);
    try {
      const { data } = await api.put<Settings>('/auth/settings', { [key]: value });
      setSettings(data);
      setSupportDraft(data.supportUrl || '');
      message.success(value ? 'Продажа включена' : 'Продажа отключена');
    } catch {
      message.error('Ошибка сохранения');
    } finally {
      setSaving(null);
    }
  };

  const saveSupportUrl = async () => {
    setSaving('supportUrl');
    try {
      const { data } = await api.put<Settings>('/auth/settings', { supportUrl: supportDraft.trim() });
      setSettings(data);
      setSupportDraft(data.supportUrl || '');
      message.success('Ссылка на поддержку сохранена');
    } catch {
      message.error('Ошибка сохранения');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '60px auto' }} />;

  const supportDirty = supportDraft.trim() !== (settings?.supportUrl || '');

  return (
    <div style={{ maxWidth: 480 }}>
      <Title level={3}>Настройки</Title>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Стандартные подписки</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Разрешить покупку и продление стандартных подписок
              </Text>
            </div>
            <Switch
              checked={settings?.standardEnabled ?? true}
              loading={saving === 'standardEnabled'}
              onChange={(v) => toggle('standardEnabled', v)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong>Антиглушилка</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Разрешить покупку и продление подписок антиглушилки
              </Text>
            </div>
            <Switch
              checked={settings?.antiThrottlingEnabled ?? true}
              loading={saving === 'antiThrottlingEnabled'}
              onChange={(v) => toggle('antiThrottlingEnabled', v)}
            />
          </div>

          <Divider style={{ margin: '4px 0' }} />

          <div>
            <Text strong>Ссылка на поддержку</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              Кнопки и упоминания поддержки в боте. Можно указать @username или https://t.me/...
            </Text>
            <Space.Compact style={{ width: '100%', marginTop: 10 }}>
              <Input
                value={supportDraft}
                placeholder="https://t.me/santa_vpn_help"
                onChange={(e) => setSupportDraft(e.target.value)}
                onPressEnter={() => { if (supportDirty) void saveSupportUrl(); }}
              />
              <Button
                type="primary"
                loading={saving === 'supportUrl'}
                disabled={!supportDirty || !supportDraft.trim()}
                onClick={() => void saveSupportUrl()}
              >
                Сохранить
              </Button>
            </Space.Compact>
            {settings?.supportHandle && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                В тексте бота: {settings.supportHandle}
              </Text>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
