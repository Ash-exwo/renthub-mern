import { Route, Routes } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/ProtectedRoute";

// Public Marketplace & Renter Pages
import HomePage from "../pages/user/HomePage";
import ExplorePage from "../pages/user/ExplorePage";
import ListingDetailPage from "../pages/user/ListingDetailPage";
import HowItWorksPage from "../pages/user/HowItWorksPage";
import LoginPage from "../pages/user/LoginPage";
import RegisterPage from "../pages/user/RegisterPage";
import ForgotPasswordPage from "../pages/user/ForgotPasswordPage";

// Authenticated Renter Pages
import MyBookingsPage from "../pages/user/MyBookingsPage";
import WishlistPage from "../pages/user/WishlistPage";
import MessagesPage from "../pages/user/MessagesPage";
import NotificationsPage from "../pages/user/NotificationsPage";
import ProfilePage from "../pages/user/ProfilePage";

// Authenticated Owner / Host Pages
import CreateListing from "../pages/user/owner/CreateListing";
import MyListingsPage from "../pages/user/owner/MyListingsPage";
import OwnerDashboardPage from "../pages/user/owner/OwnerDashboardPage";

// Dedicated Administrative Console
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminDashboard from "../pages/admin/AdminDashboard";

// Fallback Page
import NotFoundPage from "../pages/NotFoundPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<UserLayout />}>
        {/* Public Marketplace Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Renter & Host Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Protected Owner / Host Routes */}
          <Route path="/listings/new" element={<CreateListing />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Dedicated Administrative Console */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
