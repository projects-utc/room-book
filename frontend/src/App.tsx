import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { StoreProvider } from './contexts/StoreContext';
import { Header, Footer, ToastContainer } from './components/Layout';
import { AppRoutes } from './routers';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Phân hệ quản trị dùng layout chuyên biệt được tích hợp trực tiếp trong AdminRoutes
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
