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
  login: (username: string, password?: string) => Promise<{ success: boolean; code?: string; message?: string; user?: User }>;
  register: (newUser: Partial<User>) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => void;
  switchRole: (role: string) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'warn' | 'error', duration?: number) => void;
  removeToast: (id: number) => void;
  toasts: ToastMessage[];
  resetStore: () => void;
  store: typeof ODDStore;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refreshUser = useCallback(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // Check backend session on mount
  useEffect(() => {
    authApi.getMe().then(res => {
      if (res.success && res.user) {
        const mapped: User = {
          id: res.user.id,
          username: res.user.username,
          fullName: res.user.fullName,
          phone: res.user.phone,
          email: res.user.email,
          role: res.user.role,
          status: res.user.status,
        };
        ODDStore.setCurrentUser(mapped);
        setCurrentUser(mapped);
      }
    });
  }, []);

  const login = useCallback(
    async (username: string, password?: string) => {
      // 1. Try Backend API first
      const backendRes = await authApi.login({ username, password });
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
        ODDStore.setCurrentUser(mappedUser);
        setCurrentUser(mappedUser);
        return { success: true, user: mappedUser };
      }

      // If backend explicitly rejected with business error
      if (backendRes.message && !backendRes.message.includes('kết nối') && !backendRes.message.includes('fetch')) {
        return { success: false, message: backendRes.message };
      }

      // 2. Fallback to Local ODDStore
      const result = ODDStore.login(username, password);
      if (result.success) {
        refreshUser();
      }
      return result;
    },
    [refreshUser]
  );

  const register = useCallback(
    async (newUser: Partial<User>) => {
      // 1. Try Backend API first
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

      if (backendRes.message && !backendRes.message.includes('kết nối') && !backendRes.message.includes('fetch')) {
        return { success: false, message: backendRes.message };
      }

      // 2. Fallback to Local ODDStore
      return ODDStore.register(newUser);
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

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info', duration: number = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const resetStore = useCallback(() => {
    ODDStore.reset();
    refreshUser();
    addToast('Đã khôi phục CSDL về dữ liệu mẫu ban đầu.', 'success');
  }, [refreshUser, addToast]);

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        switchRole,
        addToast,
        removeToast,
        toasts,
        resetStore,
        store: ODDStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export default StoreContext;
