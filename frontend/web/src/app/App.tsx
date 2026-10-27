
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../features/home/pages/HomePage'
import ShopPage from '../features/shop/pages/ShopPage'
import ProductDetailsPage from '../features/shop/pages/ProductDetailsPage'
import CartPage from '../features/cart/pages/CartPage'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage'
import GoogleCallbackPage from '../features/auth/pages/GoogleCallbackPage'
import OrdersPage from '../features/orders/pages/OrdersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/:productId" element={<ProductDetailsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />
      <Route path="/orders" element={<OrdersPage />} />
    </Routes>
  )
}
