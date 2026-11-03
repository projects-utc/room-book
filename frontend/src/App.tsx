import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Header, Footer, ToastContainer } from './components/Layout';
import { AppRoutes } from './routers';

function AppContent() {
  const { isBackendReady } = useStore();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Backend IDE chưa chạy -> không gọi API và icon loading quay liên tục trên màn hình
  if (!isBackendReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: '4px solid #E2E8F0',
            borderTopColor: '#FF385C',
            borderRadius: '50%',
          }}
          className="animate-spin"
        />
      </div>
    );
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
