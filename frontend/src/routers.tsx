// Central Route Configuration
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminRoutes } from './routes/admin.routes';
import { HostRoutes } from './routes/host.routes';
import { ClientRoutes } from './routes/client.routes';

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Phân hệ Quản trị viên (/admin/*) */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* 2. Phân hệ Đối tác Chủ nhà (/host/*) */}
      <Route path="/host/*" element={<HostRoutes />} />

      {/* 3. Phân hệ Khách hàng (/client/* & root shortcuts) */}
      <Route path="/*" element={<ClientRoutes />} />
    </Routes>
  );
}

export default AppRoutes;
