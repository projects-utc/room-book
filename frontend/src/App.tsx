import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { StoreProvider } from './contexts/StoreContext';
import { Header, Footer, ToastContainer } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { AppRoutes } from './routers';

function AppContent() {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    // Nếu là trang quản trị, dùng layout Admin riêng (không có Header/Footer khách)
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

    // Nếu là trang khách hàng/chủ nhà, dùng layout bình thường
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