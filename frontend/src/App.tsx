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

  if (!isBackendReady) {
    if (backendWaitExpired) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 12, padding: 24, textAlign: 'center', background: 'var(--color-bg-app)', color: 'var(--color-text-primary)' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Không kết nối được backend</h1>
          <p style={{ maxWidth: 480, margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Frontend đang chạy, nhưng API tại localhost:8080 chưa phản hồi. Kiểm tra backend Java 21 và kết nối Oracle; trang sẽ tự mở khi backend sẵn sàng.
          </p>
          <button type="button" onClick={() => window.location.reload()} style={{ justifySelf: 'center', marginTop: 8, padding: '0.7rem 1rem', border: 0, borderRadius: 8, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Thử tải lại
          </button>
        </main>
      );
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
