import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './AppLayout';
import SubscriptionPage from './pages/SubscriptionPage';
import NodesPage from './pages/NodesPage';

export default function MiniApp() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<SubscriptionPage />} />
          <Route path="nodes" element={<NodesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
