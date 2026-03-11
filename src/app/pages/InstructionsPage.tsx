const s: Record<string, React.CSSProperties> = {
  page: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
  heading: { fontSize: '20px', fontWeight: 700, marginBottom: '0' },
  card: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #232e3c)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardTitle: { fontSize: '16px', fontWeight: 700 },
  step: { fontSize: '13px', lineHeight: 1.6, color: 'var(--tg-theme-text-color, #fff)' },
  hint: { fontSize: '12px', color: 'var(--tg-theme-hint-color, #7c8a94)', lineHeight: 1.5 },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    marginRight: '6px',
  },
  link: {
    color: 'var(--tg-theme-button-color, #2ea6ff)',
    textDecoration: 'none',
    fontWeight: 500,
  },
  divider: { height: '1px', backgroundColor: 'rgba(255,255,255,0.07)' },
};

interface AppGuide {
  name: string;
  icon: string;
  platform: string;
  platformColor: string;
  storeUrl: string;
  steps: string[];
}

const guides: AppGuide[] = [
  {
    name: 'Hiddify (Happ V2Ray)',
    icon: '🟣',
    platform: 'iOS / Android',
    platformColor: '#9c27b0',
    storeUrl: 'https://hiddify.com',
    steps: [
      'Скачайте и установите Hiddify из App Store / Google Play.',
      'На странице подписки нажмите кнопку «Hiddify / Happ» — приложение откроется автоматически с добавленной подпиской.',
      'Или скопируйте ссылку на подписку и вставьте в приложении: нажмите «+» → «Добавить из буфера обмена».',
      'Нажмите кнопку подключения (большая кнопка в центре).',
    ],
  },
  {
    name: 'v2rayNG',
    icon: '🟢',
    platform: 'Android',
    platformColor: '#4caf50',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.v2ray.ang',
    steps: [
      'Скачайте v2rayNG из Google Play.',
      'На странице подписки нажмите кнопку «v2rayNG» — приложение откроется и добавит подписку.',
      'Или скопируйте ссылку и в приложении: ≡ → Группы подписок → «+» → вставьте URL → сохраните → обновите подписку.',
      'Выберите сервер из списка и нажмите кнопку подключения внизу.',
    ],
  },
  {
    name: 'Streisand',
    icon: '🔵',
    platform: 'iOS / macOS',
    platformColor: '#2196f3',
    storeUrl: 'https://apps.apple.com/app/streisand/id6450534064',
    steps: [
      'Скачайте Streisand из App Store.',
      'На странице подписки нажмите кнопку «Streisand» — приложение откроется с подпиской.',
      'Или скопируйте ссылку → откройте Streisand → «+» → «Импорт из буфера».',
      'Нажмите на подключение для выбранного сервера.',
    ],
  },
  {
    name: 'V2Box',
    icon: '🟠',
    platform: 'iOS',
    platformColor: '#ff9800',
    storeUrl: 'https://apps.apple.com/app/v2box-v2ray-client/id6446814690',
    steps: [
      'Скачайте V2Box из App Store.',
      'Скопируйте ссылку на подписку со страницы подписки.',
      'Откройте V2Box → вкладка «Подписки» → «+» → вставьте URL → «Сохранить».',
      'Нажмите «Обновить» для загрузки серверов, затем подключитесь.',
    ],
  },
  {
    name: 'Nekoray / Nekobox',
    icon: '🐱',
    platform: 'Windows / Linux',
    platformColor: '#607d8b',
    storeUrl: 'https://github.com/MatsuriDayo/nekoray/releases',
    steps: [
      'Скачайте Nekoray с GitHub.',
      'Скопируйте ссылку на подписку.',
      'В Nekoray: Preferences → Groups → New Group → «Subscription» → вставьте URL.',
      'Нажмите «Update Subscription», выберите сервер и подключитесь.',
    ],
  },
];

export default function InstructionsPage() {
  return (
    <div style={s.page}>
      <h1 style={s.heading}>Инструкции по установке</h1>

      <div style={s.card}>
        <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
          <strong>Как подключить VPN:</strong>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Оформите подписку на странице «Подписка»</li>
            <li>Скачайте одно из приложений ниже</li>
            <li>Добавьте ссылку на подписку в приложение</li>
            <li>Подключитесь — готово!</li>
          </ol>
        </div>
        <div style={s.hint}>
          💡 Используйте кнопки авто-вставки на странице подписки для быстрого добавления
          в поддерживаемые приложения.
        </div>
      </div>

      {guides.map((guide) => (
        <div key={guide.name} style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>{guide.icon}</span>
            <div>
              <div style={s.cardTitle}>{guide.name}</div>
              <span
                style={{
                  ...s.badge,
                  backgroundColor: guide.platformColor + '22',
                  color: guide.platformColor,
                }}
              >
                {guide.platform}
              </span>
            </div>
          </div>

          <div style={s.divider} />

          <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {guide.steps.map((step, i) => (
              <li key={i} style={s.step}>{step}</li>
            ))}
          </ol>

          <a
            href={guide.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...s.link,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={(e) => {
              e.preventDefault();
              if (window.Telegram?.WebApp?.openLink) {
                window.Telegram.WebApp.openLink(guide.storeUrl);
              } else {
                window.open(guide.storeUrl, '_blank');
              }
            }}
          >
            📥 Скачать {guide.name}
          </a>
        </div>
      ))}

      <div style={s.card}>
        <div style={s.hint}>
          ⚠️ Если подписка не добавляется автоматически, скопируйте ссылку вручную со страницы
          «Подписка» и вставьте в приложение.
          <br /><br />
          Для вопросов обратитесь в{' '}
          <a
            href="https://t.me/hyper_vpn_help"
            style={s.link}
            onClick={(e) => {
              e.preventDefault();
              if (window.Telegram?.WebApp?.openLink) {
                window.Telegram.WebApp.openLink('https://t.me/hyper_vpn_help');
              } else {
                window.open('https://t.me/hyper_vpn_help', '_blank');
              }
            }}
          >
            техподдержку
          </a>.
        </div>
      </div>
    </div>
  );
}
