// Client / Guest Portal Routes (/client and root paths)
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Public Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Client / Guest Pages
import HomePage from '../pages/guest/HomePage';
import SearchResultsPage from '../pages/guest/SearchResultsPage';
import PropertyDetailPage from '../pages/guest/PropertyDetailPage';
import BookingQuotePage from '../pages/guest/BookingQuotePage';
import BookingSuccessPage from '../pages/guest/BookingSuccessPage';
import MyBookingsPage from '../pages/guest/MyBookingsPage';
import MyBookingDetailPage from '../pages/guest/MyBookingDetailPage';
import ReviewFormPage from '../pages/guest/ReviewFormPage';
import WishlistPage from '../pages/guest/WishlistPage';

export function ClientRoutes() {
  return (
    <Routes>
      {/* ── Public Client Pages ──────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/client" element={<HomePage />} />
      <Route path="/client/search" element={<SearchResultsPage />} />
      <Route path="/client/rooms" element={<SearchResultsPage />} />
      <Route path="/client/wishlist" element={<WishlistPage />} />
      <Route path="/client/property/:id" element={<PropertyDetailPage />} />
      <Route path="/client/booking-quote" element={<BookingQuotePage />} />
      <Route path="/client/booking-success" element={<BookingSuccessPage />} />
      <Route path="/client/login" element={<LoginPage />} />
      <Route path="/client/register" element={<RegisterPage />} />

      {/* Root shortcuts */}
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/rooms" element={<SearchResultsPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/property/:id" element={<PropertyDetailPage />} />
      <Route path="/booking-quote" element={<BookingQuotePage />} />
      <Route path="/booking-success" element={<BookingSuccessPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected Client Pages (Yêu cầu đăng nhập) ──────── */}
      <Route
        path="/client/my-bookings"
        element={
          <ProtectedRoute unauthenticatedMessage="Vui lòng đăng nhập để xem danh sách chuyến đi của bạn.">
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute unauthenticatedMessage="Vui lòng đăng nhập để xem danh sách chuyến đi của bạn.">
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/my-bookings/:code"
        element={
          <ProtectedRoute unauthenticatedMessage="Vui lòng đăng nhập để xem chi tiết đặt phòng.">
            <MyBookingDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings/:code"
        element={
          <ProtectedRoute unauthenticatedMessage="Vui lòng đăng nhập để xem chi tiết đặt phòng.">
            <MyBookingDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/review"
        element={
          <ProtectedRoute unauthenticatedMessage="Vui lòng đăng nhập để viết đánh giá homestay.">
            <ReviewFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review"
        element={
          <ProtectedRoute unauthenticatedMessage="Vui lòng đăng nhập để viết đánh giá homestay.">
            <ReviewFormPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback to client home */}
      <Route path="*" element={<Navigate to="/client" replace />} />
    </Routes>
  );
}

export default ClientRoutes;

