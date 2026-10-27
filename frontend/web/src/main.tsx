
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { CartProvider } from './features/cart/context/CartContext'
import { AuthProvider } from './features/auth/context/AuthContext'
import NavigationLoader from './components/layout/NavigationLoader'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <AuthProvider>
          <NavigationLoader />
          <App />
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
