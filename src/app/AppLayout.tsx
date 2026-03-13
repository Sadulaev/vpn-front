import { Outlet, NavLink, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { setStoredAccessToken, miniappAPI } from '../services/miniapp-api';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    backgroundColor: 'var(--tg-theme-bg-color, #17212b)',
    color: 'var(--tg-theme-text-color, #ffffff)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '68px',
  },
  tabBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #232e3c)',
    display: 'flex',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    textDecoration: 'none',
    color: 'var(--tg-theme-hint-color, #7c8a94)',
    fontSize: '11px',
    fontWeight: 500,
    transition: 'color 0.15s',
  },
  tabItemActive: {
    color: 'var(--tg-theme-button-color, #2ea6ff)',
  },
  tabIcon: {
    fontSize: '22px',
    lineHeight: 1,
  },
};

export default function AppLayout() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    miniappAPI.verifyToken(token)
      .then(({ valid }) => {
        if (valid) {
          setStoredAccessToken(token);
          setStatus('ok');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'error') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', backgroundColor: '#f5f5f5', color: '#333', fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: '96px', fontWeight: 700, color: '#ccc', lineHeight: 1 }}>404</div>
        <div style={{ fontSize: '18px', marginTop: '16px', color: '#666' }}>Страница не найдена</div>
      </div>
    );
  }

  if (status === 'loading') {
    return <div style={{ minHeight: '100dvh', backgroundColor: '#f5f5f5' }} />;
  }

  const base = `/app/${token}`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.content}>
        <Outlet />
      </div>

      <nav style={styles.tabBar}>
        <NavLink
          to={base}
          end
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>�</span>
          <span>Стандарт</span>
        </NavLink>

        <NavLink
          to={`${base}/anti`}
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>🛡️</span>
          <span>Антиглушилка <span style={{ fontSize: '9px', backgroundColor: '#f9a825', color: '#000', borderRadius: '4px', padding: '1px 4px', fontWeight: 700, verticalAlign: 'middle' }}>BETA</span></span>
        </NavLink>

        <NavLink
          to={`${base}/nodes`}
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>🖥</span>
          <span>Серверы</span>
        </NavLink>

        <NavLink
          to={`${base}/instructions`}
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>📍</span>
          <span>Инструкции</span>
        </NavLink>
      </nav>
    </div>
  );
}
