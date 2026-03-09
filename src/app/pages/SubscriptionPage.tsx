import { useEffect, useState } from 'react';
import { miniappAPI, SubscriptionData } from '../../services/miniapp-api';

const BYTES_IN_GB = 1024 * 1024 * 1024;

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  const gb = bytes / BYTES_IN_GB;
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

function formatExpire(expire: number | null | undefined): string {
  if (!expire) return 'Бессрочно';
  const date = new Date(expire * 1000);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function daysUntil(expire: number | null | undefined): number | null {
  if (!expire) return null;
  const diff = expire * 1000 - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function statusLabel(status: string | undefined | null): { text: string; color: string } {
  switch (status) {
    case 'active': return { text: 'Активна', color: '#4caf50' };
    case 'disabled': return { text: 'Отключена', color: '#f44336' };
    case 'expired': return { text: 'Истекла', color: '#ff9800' };
    case 'limited': return { text: 'Лимит трафика', color: '#ff5722' };
    default: return { text: status ?? '—', color: '#9e9e9e' };
  }
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  heading: { fontSize: '20px', fontWeight: 700, marginBottom: '4px' },
  card: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #232e3c)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'var(--tg-theme-hint-color, #7c8a94)', fontSize: '14px' },
  value: { fontSize: '14px', fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' },
  divider: { height: '1px', backgroundColor: 'rgba(255,255,255,0.07)' },
  statusBadge: { padding: '2px 8px', borderRadius: '999px', fontSize: '13px', fontWeight: 600 },
  urlBox: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #232e3c)',
    borderRadius: '12px',
    padding: '14px 16px',
  },
  urlBoxTitle: { fontSize: '14px', fontWeight: 600, marginBottom: '8px' },
  urlRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  urlText: {
    flex: 1, fontSize: '12px', color: 'var(--tg-theme-hint-color, #7c8a94)',
    overflowX: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  copyBtn: {
    padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    backgroundColor: 'var(--tg-theme-button-color, #2ea6ff)',
    color: 'var(--tg-theme-button-text-color, #ffffff)',
    fontSize: '13px', fontWeight: 600, flexShrink: 0,
  },
  instructCard: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #232e3c)',
    borderRadius: '12px',
    padding: '16px',
  },
  instructTitle: { fontSize: '15px', fontWeight: 700, marginBottom: '12px' },
  appTabs: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' },
  appTab: {
    padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
    cursor: 'pointer', border: '1px solid transparent',
    transition: 'background 0.15s',
  },
  step: { fontSize: '13px', color: 'var(--tg-theme-hint-color, #7c8a94)', lineHeight: '1.6', marginBottom: '4px' },
  noSubCard: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #232e3c)',
    borderRadius: '12px',
    padding: '32px 16px',
    textAlign: 'center',
  },
  noSubIcon: { fontSize: '48px', marginBottom: '12px' },
  noSubText: { fontSize: '15px', color: 'var(--tg-theme-hint-color, #7c8a94)', lineHeight: '1.5' },
};

const APPS: { name: string; steps: string[] }[] = [
  {
    name: 'NekoBox',
    steps: [
      '1. Установите NekoBox из Google Play',
      '2. Нажмите «+» → «Добавить по ссылке»',
      '3. Вставьте скопированную ссылку',
      '4. Нажмите «Подключить»',
    ],
  },
  {
    name: 'Clash',
    steps: [
      '1. Скачайте ClashMeta или FlClash',
      '2. Профили → «Новый профиль»',
      '3. Выберите «URL» и вставьте ссылку',
      '4. Активируйте профиль',
    ],
  },
  {
    name: 'Hiddify',
    steps: [
      '1. Скачайте Hiddify из официального сайта',
      '2. Нажмите «Добавить конфиг»',
      '3. Вставьте ссылку на подписку',
      '4. Подключитесь',
    ],
  },
  {
    name: 'V2RayNG',
    steps: [
      '1. Установите V2RayNG',
      '2. ⋮ → «Подписка» → «Настройки группы»',
      '3. Добавьте ссылку и обновите',
      '4. Выберите сервер и подключитесь',
    ],
  },
];

export default function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeApp, setActiveApp] = useState(0);

  useEffect(() => {
    miniappAPI.getMe()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message ?? 'Ошибка загрузки данных'));
  }, []);

  const handleCopy = () => {
    if (!data?.subscriptionUrl) return;
    navigator.clipboard.writeText(data.subscriptionUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (error) {
    return (
      <div style={s.page}>
        <div style={{ ...s.noSubCard }}>
          <div style={s.noSubIcon}>⚠️</div>
          <div style={{ ...s.noSubText, color: '#f44336' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ ...s.page, alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '16px', color: 'var(--tg-theme-hint-color, #7c8a94)' }}>Загрузка…</div>
      </div>
    );
  }

  if (!data.hasSubscription) {
    return (
      <div style={s.page}>
        <h1 style={s.heading}>Подписка</h1>
        <div style={s.noSubCard}>
          <div style={s.noSubIcon}>📭</div>
          <div style={s.noSubText}>У вас пока нет активной подписки.<br />Обратитесь к боту для оформления.</div>
        </div>
      </div>
    );
  }

  const { text: statusText, color: statusColor } = statusLabel(data.status);
  const days = daysUntil(data.expire);
  const usedGb = data.usedTraffic != null ? data.usedTraffic / BYTES_IN_GB : null;
  const limitGb = data.dataLimit ? data.dataLimit / BYTES_IN_GB : null;
  const trafficPct = usedGb != null && limitGb ? Math.min(100, (usedGb / limitGb) * 100) : null;

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Подписка</h1>

      {/* Info card */}
      <div style={s.card}>
        <div style={s.row}>
          <span style={s.label}>Пользователь</span>
          <span style={s.value}>{data.marzbanUsername ?? '—'}</span>
        </div>
        <div style={s.divider} />

        <div style={s.row}>
          <span style={s.label}>Статус</span>
          <span style={{ ...s.statusBadge, backgroundColor: statusColor + '22', color: statusColor }}>
            {statusText}
          </span>
        </div>
        <div style={s.divider} />

        <div style={s.row}>
          <span style={s.label}>Истекает</span>
          <span style={s.value}>
            {formatExpire(data.expire)}
            {days != null && <span style={{ color: days <= 3 ? '#f44336' : 'var(--tg-theme-hint-color,#7c8a94)', fontSize: '12px', marginLeft: '6px' }}>({days} дн.)</span>}
          </span>
        </div>
        <div style={s.divider} />

        <div style={s.row}>
          <span style={s.label}>Трафик</span>
          <span style={s.value}>
            {formatBytes(data.usedTraffic)} / {limitGb ? `${limitGb.toFixed(0)} GB` : '∞'}
          </span>
        </div>

        {trafficPct != null && (
          <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${trafficPct}%`, borderRadius: '3px', backgroundColor: trafficPct > 85 ? '#f44336' : 'var(--tg-theme-button-color, #2ea6ff)', transition: 'width 0.3s' }} />
          </div>
        )}
      </div>

      {/* Subscription URL */}
      {data.subscriptionUrl && (
        <div style={s.urlBox}>
          <div style={s.urlBoxTitle}>Ссылка на подписку</div>
          <div style={s.urlRow}>
            <span style={s.urlText}>{data.subscriptionUrl}</span>
            <button style={s.copyBtn} onClick={handleCopy}>
              {copied ? '✓ Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>
      )}

      {/* Installation instructions */}
      <div style={s.instructCard}>
        <div style={s.instructTitle}>Как подключиться</div>

        <div style={s.appTabs}>
          {APPS.map((app, i) => (
            <button
              key={app.name}
              onClick={() => setActiveApp(i)}
              style={{
                ...s.appTab,
                backgroundColor: activeApp === i ? 'var(--tg-theme-button-color, #2ea6ff)' : 'rgba(255,255,255,0.07)',
                color: activeApp === i ? 'var(--tg-theme-button-text-color, #fff)' : 'var(--tg-theme-text-color, #fff)',
              }}
            >
              {app.name}
            </button>
          ))}
        </div>

        {APPS[activeApp].steps.map((step) => (
          <div key={step} style={s.step}>{step}</div>
        ))}
      </div>
    </div>
  );
}
