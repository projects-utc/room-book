// Route Definitions (TypeScript)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/guest/HomePage';
import SearchResultsPage from './pages/guest/SearchResultsPage';
import PropertyDetailPage from './pages/guest/PropertyDetailPage';
import BookingQuotePage from './pages/guest/BookingQuotePage';
import BookingSuccessPage from './pages/guest/BookingSuccessPage';
import MyBookingsPage from './pages/guest/MyBookingsPage';
import MyBookingDetailPage from './pages/guest/MyBookingDetailPage';
import ReviewFormPage from './pages/guest/ReviewFormPage';
import HostPropertiesPage from './pages/host/HostPropertiesPage';
import HostRoomsPage from './pages/host/HostRoomsPage';
import HostRoomBlockPage from './pages/host/HostRoomBlockPage';
import HostBookingsPage from './pages/host/HostBookingsPage';
import HostBookingDetailPage from './pages/host/HostBookingDetailPage';
import HostRevenuePage from './pages/host/HostRevenuePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Guest & Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/property/:id" element={<PropertyDetailPage />} />
      <Route path="/booking-quote" element={<BookingQuotePage />} />
      <Route path="/booking-success" element={<BookingSuccessPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/my-bookings/:code" element={<MyBookingDetailPage />} />
      <Route path="/review" element={<ReviewFormPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Host Routes */}
      <Route path="/host/properties" element={<HostPropertiesPage />} />
      <Route path="/host/rooms" element={<HostRoomsPage />} />
      <Route path="/host/roomblock" element={<HostRoomBlockPage />} />
      <Route path="/host/bookings" element={<HostBookingsPage />} />
      <Route path="/host/bookings/:code" element={<HostBookingDetailPage />} />
      <Route path="/host/revenue" element={<HostRevenuePage />} />

      {/* Admin Routes */}
      <Route path="/admin/users" element={<AdminUsersPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
