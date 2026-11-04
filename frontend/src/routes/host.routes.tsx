// Host Management Routes (HOST, ADMIN)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

import HostPropertiesPage from '../pages/host/HostPropertiesPage';
import HostRoomsPage from '../pages/host/HostRoomsPage';
import HostRoomBlockPage from '../pages/host/HostRoomBlockPage';
import HostBookingsPage from '../pages/host/HostBookingsPage';
import HostBookingDetailPage from '../pages/host/HostBookingDetailPage';
import HostRevenuePage from '../pages/host/HostRevenuePage';

export function HostRoutes() {
  return (
    <ProtectedRoute
      allowedRoles={['HOST', 'ADMIN']}
      unauthorizedMessage="Bạn cần tài khoản Đối tác Chủ nhà (Host) để quản lý homestay."
    >
      <Routes>
        <Route index element={<Navigate to="/host/properties" replace />} />
        <Route path="properties" element={<HostPropertiesPage />} />
        <Route path="rooms" element={<HostRoomsPage />} />
        <Route path="roomblock" element={<HostRoomBlockPage />} />
        <Route path="bookings" element={<HostBookingsPage />} />
        <Route path="bookings/:code" element={<HostBookingDetailPage />} />
        <Route path="revenue" element={<HostRevenuePage />} />
        <Route path="*" element={<Navigate to="/host/properties" replace />} />
      </Routes>
    </ProtectedRoute>
  );
}

export default HostRoutes;

