import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ODDStore, getCurrentUser } from '../store';
import { User } from '../data';
import { authApi } from '../api/authApi';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface StoreContextType {
  currentUser: User | null;
  isBackendReady: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; user?: User }>;
  register: (newUser: Partial<User>) => Promise<{ success: boolean; user?: User }>;
  logout: () => void;
  switchRole: (role: string) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'warn' | 'error', duration?: number) => void;
  removeToast: (id: number) => void;
  toasts: ToastMessage[];
  resetStore: () => void;
  store: typeof ODDStore;
  dataVersion?: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dataVersion, setDataVersion] = useState<number>(0);

  const refreshUser = useCallback(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    return ODDStore.subscribe(() => {
      setDataVersion(v => v + 1);
    });
  }, []);

  // Kiểm tra backend IDE có đang chạy hay không. Nếu chưa chạy -> poll kiểm tra liên tục
  useEffect(() => {
    let timer: any;
    let isMounted = true;

    const checkBackend = async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          if (isMounted) setIsBackendReady(true);
          return;
        }
      } catch {
        // Backend IDE chưa chạy
      }

      if (isMounted) {
        setIsBackendReady(false);
        timer = setTimeout(checkBackend, 2500);
      }
    };

    checkBackend();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Đồng bộ dữ liệu từ backend và kiểm tra phiên đăng nhập thực tế khi load trang
  useEffect(() => {
    ODDStore.syncFromBackend().finally(() => {
      refreshUser();
    });

    const token = authApi.getToken();
    if (token) {
      authApi.checkRole().then((res) => {
        if (res.success && res.user) {
          const u = res.user;
          const mappedUser: User = {
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            phone: u.phone || '',
            email: u.email,
            role: u.role,
            status: u.status,
          };
          ODDStore.setCurrentUser(mappedUser);
          setCurrentUser(mappedUser);
        } else {
          authApi.clearToken();
          ODDStore.logout();
          setCurrentUser(null);
        }
      });
    }
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password?: string) => {
      try {
        const backendRes = await authApi.login({ username, password });
        if (backendRes.success) {
          // Lấy thông tin tài khoản và vai trò thực tế từ backend
          const roleRes = await authApi.checkRole();
          const u = roleRes.success && roleRes.user ? roleRes.user : backendRes.data?.user;
          if (u) {
            const mappedUser: User = {
              id: u.id,
              username: u.username,
              fullName: u.fullName,
              phone: u.phone || '',
              email: u.email,
              role: u.role,
              status: u.status,
            };
            ODDStore.setCurrentUser(mappedUser);
            setCurrentUser(mappedUser);
            return { success: true, user: mappedUser };
          }
        }
        return { success: false };
      } catch {
        return { success: false };
      }
    },
    []
  );

  const register = useCallback(
    async (newUser: Partial<User>) => {
      try {
        const backendRes = await authApi.register({
          username: newUser.username || '',
          password: newUser.password || '',
          fullName: newUser.fullName || '',
          phone: newUser.phone || '',
          email: newUser.email || '',
          role: newUser.role === 'HOST' ? 'HOST' : 'GUEST',
        });

        if (backendRes.success && backendRes.data?.user) {
          const u = backendRes.data.user;
          const mappedUser: User = {
            id: u.id,
            username: u.username,
            fullName: u.fullName,
            phone: u.phone,
            email: u.email,
            role: u.role,
            status: u.status,
          };
          ODDStore.register(mappedUser);
          return { success: true, user: mappedUser };
        }
        return { success: false };
      } catch {
        return { success: false };
      }
    },
    []
  );

  const logout = useCallback(() => {
    authApi.clearToken();
    ODDStore.logout();
    setCurrentUser(null);
  }, []);

  const switchRole = useCallback(
    async (role: string) => {
      const roleMap: Record<string, { username: string; password: string }> = {
        guest: { username: 'guest.demo', password: '123' },
        host: { username: 'host.demo', password: '123' },
        admin: { username: 'admin', password: '123' },
      };
      if (role === 'logout') {
        logout();
        return;
      }
      const creds = roleMap[role];
      if (creds) {
        await login(creds.username, creds.password);
      }
    },
    [login, logout]
  );

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetStore = useCallback(() => {
    ODDStore.reset();
    refreshUser();
  }, [refreshUser]);

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        isBackendReady,
        login,
        register,
        logout,
        switchRole,
        addToast,
        removeToast,
        toasts,
        resetStore,
        store: ODDStore,
        dataVersion,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
