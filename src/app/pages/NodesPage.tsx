import { useEffect, useState } from 'react';
import { miniappAPI, NodeData } from '../../services/miniapp-api';

type NodeStatus = NodeData['status'];

const statusConfig: Record<NodeStatus, { label: string; color: string; dot: string }> = {
  connected: { label: 'Подключён', color: '#4caf50', dot: '🟢' },
  connecting: { label: 'Подключение…', color: '#ff9800', dot: '🟡' },
  error: { label: 'Ошибка', color: '#f44336', dot: '🔴' },
  disabled: { label: 'Отключён', color: '#9e9e9e', dot: '⚫' },
};

const s: Record<string, React.CSSProperties> = {
  page: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  heading: { fontSize: '20px', fontWeight: 700, marginBottom: '4px' },
  subheading: { fontSize: '13px', color: 'var(--tg-theme-hint-color, #7c8a94)', marginBottom: '8px' },
  nodeCard: {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #232e3c)',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dot: { fontSize: '18px', flexShrink: 0 },
  nodeInfo: { flex: 1, minWidth: 0 },
  nodeName: { fontSize: '15px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  nodeStatus: { fontSize: '12px', fontWeight: 500 },
  nodeMsg: { fontSize: '11px', color: 'var(--tg-theme-hint-color, #7c8a94)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: {
    padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, flexShrink: 0,
  },
};

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    miniappAPI.getNodes()
      .then(setNodes)
      .catch((e) => setError(e?.response?.data?.message ?? 'Ошибка загрузки'));
  }, []);

  if (error) {
    return (
      <div style={s.page}>
        <h1 style={s.heading}>Серверы</h1>
        <div style={{ ...s.nodeCard, justifyContent: 'center', color: '#f44336', padding: '32px' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!nodes) {
    return (
      <div style={{ ...s.page, alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '16px', color: 'var(--tg-theme-hint-color, #7c8a94)' }}>Загрузка…</div>
      </div>
    );
  }

  const connected = nodes.filter((n) => n.status === 'connected').length;

  return (
    <div style={s.page}>
      <h1 style={s.heading}>Серверы</h1>
      <p style={s.subheading}>
        {connected} из {nodes.length} нод активны
      </p>

      {nodes.map((node) => {
        const cfg = statusConfig[node.status] ?? { label: node.status, color: '#9e9e9e', dot: '⚫' };
        return (
          <div key={node.id} style={s.nodeCard}>
            <span style={s.dot}>{cfg.dot}</span>
            <div style={s.nodeInfo}>
              <div style={s.nodeName}>{node.name}</div>
              {node.message && node.status !== 'connected' && (
                <div style={s.nodeMsg}>{node.message}</div>
              )}
              <div style={{ ...s.nodeStatus, color: 'var(--tg-theme-hint-color, #7c8a94)' }}>
                {node.address}
              </div>
            </div>
            <span style={{ ...s.badge, backgroundColor: cfg.color + '22', color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        );
      })}

      {nodes.length === 0 && (
        <div style={{ ...s.nodeCard, justifyContent: 'center', padding: '32px', color: 'var(--tg-theme-hint-color,#7c8a94)' }}>
          Нет доступных серверов
        </div>
      )}
    </div>
  );
}
