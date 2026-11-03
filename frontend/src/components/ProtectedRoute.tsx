import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Array<'ADMIN' | 'HOST' | 'GUEST'>;
  redirectTo?: string;
  unauthorizedMessage?: string;
  unauthenticatedMessage?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
  unauthorizedMessage,
  unauthenticatedMessage,
}: ProtectedRouteProps) {
  const { currentUser, addToast } = useStore();
  const location = useLocation();
  const toastFiredRef = useRef(false);

  const isAuthenticated = !!currentUser;
  const isAuthorized = !allowedRoles || (currentUser && allowedRoles.includes(currentUser.role as any));

  useEffect(() => {
    if (!isAuthenticated && !toastFiredRef.current) {
      toastFiredRef.current = true;
      addToast(unauthenticatedMessage || 'Vui lòng đăng nhập để tiếp tục.', 'warning');
    } else if (isAuthenticated && !isAuthorized && !toastFiredRef.current) {
      toastFiredRef.current = true;
      addToast(unauthorizedMessage || 'Bạn không có quyền truy cập trang này.', 'error');
    }
  }, [isAuthenticated, isAuthorized, addToast, unauthenticatedMessage, unauthorizedMessage]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    const defaultRedirect =
      redirectTo ||
      (currentUser?.role === 'HOST'
        ? '/host/properties'
        : currentUser?.role === 'ADMIN'
        ? '/admin'
        : '/client');
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
}

export default ProtectedRoute;

