// Admin Management Routes (ADMIN only)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminLayout } from '../components/AdminLayout';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminPropertiesPage from '../pages/admin/AdminPropertiesPage';
import AdminBookingsPage from '../pages/admin/AdminBookingsPage';
import AdminPromotionsPage from '../pages/admin/AdminPromotionsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

export function AdminRoutes() {
  return (
    <ProtectedRoute
      allowedRoles={['ADMIN']}
      unauthorizedMessage="Bạn không có quyền truy cập khu vực Quản trị viên."
    >
      <AdminLayout>
        <Routes>
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="properties" element={<AdminPropertiesPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default AdminRoutes;

