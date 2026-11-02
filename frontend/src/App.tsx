import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { StoreProvider } from './contexts/StoreContext';
import { Header, Footer, ToastContainer } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { AppRoutes } from './routers';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="admin-app-shell">
        <AdminLayout>
          <AppRoutes />
        </AdminLayout>
        <ToastContainer />
      </div>
    );
  }

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
