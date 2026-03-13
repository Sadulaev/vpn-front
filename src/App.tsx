import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Miniapp — all pages under /app/:token */}
        <Route path="/app/:token" element={<AppLayout />}>
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
