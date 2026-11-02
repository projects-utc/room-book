// Route Definitions (TypeScript)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages - Guest / Client
import HomePage from './pages/guest/HomePage';
import SearchResultsPage from './pages/guest/SearchResultsPage';
import PropertyDetailPage from './pages/guest/PropertyDetailPage';
import BookingQuotePage from './pages/guest/BookingQuotePage';
import BookingSuccessPage from './pages/guest/BookingSuccessPage';
import MyBookingsPage from './pages/guest/MyBookingsPage';
import MyBookingDetailPage from './pages/guest/MyBookingDetailPage';
import ReviewFormPage from './pages/guest/ReviewFormPage';

// Pages - Host
import HostPropertiesPage from './pages/host/HostPropertiesPage';
import HostRoomsPage from './pages/host/HostRoomsPage';
import HostRoomBlockPage from './pages/host/HostRoomBlockPage';
import HostBookingsPage from './pages/host/HostBookingsPage';
import HostBookingDetailPage from './pages/host/HostBookingDetailPage';
import HostRevenuePage from './pages/host/HostRevenuePage';

// Pages - Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export function AppRoutes() {
      return (
          <Routes>
                {/* ── Client / Guest Routes (/client and root /) ────────────────────── */}
                <Route path="/" element={<HomePage />} />
                <Route path="/client" element={<HomePage />} />
                <Route path="/client/search" element={<SearchResultsPage />} />
                <Route path="/client/property/:id" element={<PropertyDetailPage />} />
                <Route path="/client/booking-quote" element={<BookingQuotePage />} />
                <Route path="/client/booking-success" element={<BookingSuccessPage />} />
                <Route path="/client/my-bookings" element={<MyBookingsPage />} />
                <Route path="/client/my-bookings/:code" element={<MyBookingDetailPage />} />
                <Route path="/client/review" element={<ReviewFormPage />} />
                <Route path="/client/login" element={<LoginPage />} />
                <Route path="/client/register" element={<RegisterPage />} />

                {/* Root shortcuts for client */}
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

                {/* ── Admin Management Routes (/admin) ─────────────────────────────── */}
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/properties" element={<AdminPropertiesPage />} />
                <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      );
}

export default AppRoutes;