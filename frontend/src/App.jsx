import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import WholesalePage from './pages/WholesalePage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUIUX from './pages/admin/AdminUIUX.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminReels from './pages/admin/AdminReels.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import Navbar from './components/Navbar.jsx';
import AuthDialog from './components/AuthDialog.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

export default function App() {
  useEffect(() => {
    document.body.classList.add('theme-coastal');
    return () => document.body.classList.remove('theme-coastal');
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <AuthDialog />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/products" element={<Navigate to="/#products" replace />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/wholesale" element={<WholesalePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/uiux" element={<AdminRoute><AdminUIUX /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/reels" element={<AdminRoute><AdminReels /></AdminRoute>} />
        <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
