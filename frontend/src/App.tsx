import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StoreProvider } from './contexts/StoreContext';
import { Header, Footer, ToastContainer } from './components/Layout';
import { AppRoutes } from './routers';

export function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header />
          <div style={{ flex: 1 }}>
            <AppRoutes />
          </div>
          <Footer />
          <ToastContainer />
        </div>
      </StoreProvider>
    </BrowserRouter>
  );
}

export default App;
