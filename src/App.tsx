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

/** Validates token via backend and stores it, or shows a generic 404 */
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
        minHeight: '100dvh', backgroundColor: '#f5f5f5', color: '#333', fontFamily: 'sans-serif',
      }}>
        <div style={{ fontSize: '96px', fontWeight: 700, color: '#ccc', lineHeight: 1 }}>404</div>
        <div style={{ fontSize: '18px', marginTop: '16px', color: '#666' }}>Страница не найдена</div>
      </div>
    );
  }

  // Loading — blank while verifying
  return <div style={{ minHeight: '100dvh', backgroundColor: '#f5f5f5' }} />;
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
