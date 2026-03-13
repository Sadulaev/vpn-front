import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import MarzbanPage from './pages/MarzbanPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import MessagesPage from './pages/MessagesPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import AppLayout from './app/AppLayout';
import SubscriptionPage from './app/pages/SubscriptionPage';
import AntiThrottlingPage from './app/pages/AntiThrottlingPage';
import NodesPage from './app/pages/NodesPage';
import InstructionsPage from './app/pages/InstructionsPage';
import { setStoredAccessToken, miniappAPI } from './services/miniapp-api';

/** Validates token via backend and stores it, or shows an error stub */
function AuthGate() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) { setError(true); return; }
    miniappAPI.verifyToken(token).then(({ valid }) => {
      if (valid) {
        setStoredAccessToken(token);
        navigate('/app', { replace: true });
      } else {
        setError(true);
      }
    }).catch(() => setError(true));
  }, [token, navigate]);

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', backgroundColor: '#17212b', color: '#fff', padding: '32px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Неверная ссылка</div>
        <div style={{ fontSize: '14px', color: '#7c8a94' }}>Ссылка недействительна или устарела. Попросите новую у бота.</div>
      </div>
    );
  }

  // Loading
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', backgroundColor: '#17212b' }}>
      <div style={{ color: '#7c8a94', fontSize: '16px' }}>Проверка…</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Miniapp */}
        <Route path="/app/auth/:token" element={<AuthGate />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<SubscriptionPage />} />
          <Route path="anti" element={<AntiThrottlingPage />} />
          <Route path="nodes" element={<NodesPage />} />
          <Route path="instructions" element={<InstructionsPage />} />
        </Route>

        {/* Admin panel */}
        <Route path="/admin/*" element={
          <AuthProvider>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="subscriptions" replace />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="servers" element={<MarzbanPage />} />
                <Route path="pools" element={<MarzbanPage />} />
                <Route path="marzban" element={<MarzbanPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </AuthProvider>
        } />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
