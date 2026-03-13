import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import MarzbanPage from './pages/MarzbanPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import MessagesPage from './pages/MessagesPage';
import PaymentsPage from './pages/PaymentsPage';
import AppLayout from './app/AppLayout';
import SubscriptionPage from './app/pages/SubscriptionPage';
import AntiThrottlingPage from './app/pages/AntiThrottlingPage';
import NodesPage from './app/pages/NodesPage';
import InstructionsPage from './app/pages/InstructionsPage';
import { setStoredAccessToken } from './services/miniapp-api';

/** Stores access token from URL and redirects to /app */
function TokenRedirect() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      setStoredAccessToken(token);
    }
    navigate('/app', { replace: true });
  }, [token, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Telegram Mini App */}
        <Route path="/app/t/:token" element={<TokenRedirect />} />
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
