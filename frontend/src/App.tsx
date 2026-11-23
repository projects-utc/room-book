import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Header, Footer, ToastContainer } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AppRoutes } from './routers';

function AppContent() {
  const { isBackendReady } = useStore();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Chặn hoàn toàn: Nếu backend chưa sẵn sàng / chưa chạy thì không render giao diện, giữ loading spinner
  if (!isBackendReady) {
    return <LoadingSpinner fullPage />;
  }

  // Phân hệ quản trị
  if (isAdminPath) {
    return (
      <div className="admin-app-shell">
        <AppRoutes />
        <ToastContainer />
      </div>
    );
  }

  // Layout tiêu chuẩn cho Khách hàng & Chủ nhà
  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ flex: 1 }}>
        <AppRoutes />
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </BrowserRouter>
  );
}

export default App;
