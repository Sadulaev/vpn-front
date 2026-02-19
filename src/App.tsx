import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import ServersPage from './pages/ServersPage';
import PoolsPage from './pages/PoolsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import MessagesPage from './pages/MessagesPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/subscriptions" replace />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="servers" element={<ServersPage />} />
            <Route path="pools" element={<PoolsPage />} />
            <Route path="messages" element={<MessagesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
