import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStoredAccessToken, miniappAPI, setStoredAccessToken } from '../services/miniapp-api';

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
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      const twa = window.Telegram?.WebApp;
      if (twa && twa.initData) {
        twa.ready();
        twa.expand();
        // Fetch and store access token for future direct access
        try {
          const { accessToken } = await miniappAPI.getAccessToken();
          setStoredAccessToken(accessToken);
        } catch {
          // Non-critical — token fetch can fail silently
        }
        setIsAuthed(true);
      } else if (getStoredAccessToken()) {
        // Direct access via stored token
        setIsAuthed(true);
      } else {
        setIsAuthed(false);
      }
    };

    if (window.Telegram?.WebApp) {
      init();
    } else {
      const timer = setTimeout(init, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  if (isAuthed === null) {
    // Ещё загружается
    return <div style={styles.wrapper} />;
  }

  if (!isAuthed) {
    return (
      <div style={{ ...styles.wrapper, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>HyperVPN</div>
          <div style={{ fontSize: '14px', color: 'var(--tg-theme-hint-color, #7c8a94)' }}>
            Откройте это приложение через Telegram бота или используйте персональную ссылку
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.content}>
        <Outlet />
      </div>

      <nav style={styles.tabBar}>
        <NavLink
          to="/app"
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
          to="/app/anti"
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>🛡️</span>
          <span>Антиглушилка</span>
        </NavLink>

        <NavLink
          to="/app/nodes"
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>🖥</span>
          <span>Серверы</span>
        </NavLink>

        <NavLink
          to="/app/instructions"
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
