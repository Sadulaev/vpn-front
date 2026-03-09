import { Outlet, NavLink } from 'react-router-dom';

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
  return (
    <div style={styles.wrapper}>
      <div style={styles.content}>
        <Outlet />
      </div>

      <nav style={styles.tabBar}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>📱</span>
          <span>Подписка</span>
        </NavLink>

        <NavLink
          to="/nodes"
          style={({ isActive }) => ({
            ...styles.tabItem,
            ...(isActive ? styles.tabItemActive : {}),
          })}
        >
          <span style={styles.tabIcon}>🖥</span>
          <span>Серверы</span>
        </NavLink>
      </nav>
    </div>
  );
}
