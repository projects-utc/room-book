import React, { useEffect, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Header, Footer, ToastContainer } from './components/Layout';
import { AppRoutes } from './routers';

function AppContent() {
  const { isBackendReady } = useStore();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const [backendWaitExpired, setBackendWaitExpired] = useState(false);

  useEffect(() => {
    if (isBackendReady) {
      setBackendWaitExpired(false);
      return;
    }

    const timer = window.setTimeout(() => setBackendWaitExpired(true), 6000);
    return () => window.clearTimeout(timer);
  }, [isBackendReady]);

  // Nếu backend chưa sẵn sàng trong 6 giây đầu, hiển thị hiệu ứng tải;
  // Sau đó cho phép tải giao diện với dữ liệu cục bộ để tránh treo trắng trang (hỗ trợ Render cold-start)
  if (!isBackendReady && !backendWaitExpired) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--color-bg-app)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            border: '4px solid var(--color-border-subtle)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
          }}
          className="animate-spin"
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Đang kết nối hệ thống ODauDay Stay...
        </span>
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
