
import { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  ClipboardList,
  X,
} from 'lucide-react'
import './Header.css'
import { useCart } from '../../features/cart/context/CartContext'
import { useAuth } from '../../features/auth/context/AuthContext'


export default function Header() {
  const { itemCount } = useCart()
  const { user, isRestoring, logout } = useAuth()
  const { pathname } = useLocation()

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isHomePage = pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30)

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsAccountMenuOpen(false)
  }, [pathname])

  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)
    setIsAccountMenuOpen(false)

    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }

    window.setTimeout(() => {
      window.location.assign('/')
    }, 800)
  }

  function handleSectionNavigation(
  event: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string,
) {
  event.preventDefault()
  setIsMenuOpen(false)

  if (pathname !== '/') {
    window.location.href = `/#${sectionId}`
    return
  }

  document.getElementById(sectionId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

  if (window.location.hash !== `#${sectionId}`) {
    window.history.pushState(null, '', `/#${sectionId}`)
  }
}

  return (
    <>
      {isLoggingOut && (
        <div className="logout-screen" role="status" aria-live="polite">
          <div className="logout-screen__content">
            <div className="logout-screen__brand">
              Rà<span>tech</span>
              <span className="logo-dot">.</span>
            </div>

            <div className="logout-screen__spinner" />

            <h1>Logging you out</h1>
            <p>Thank you for shopping with Ràtech.</p>
          </div>
        </div>
      )}

      <header
        className={`site-header ${
          isHomePage && isScrolled ? 'site-header--solid' : ''
        }`}
      >
        <Link
          to="/"
          className="site-logo"
          aria-label="Ràtech home"
          onClick={(event) => {
            if (pathname === '/') event.preventDefault()
          }}
        >
          Rà<span>tech</span>
          <span className="logo-dot">.</span>
        </Link>

        <nav
          className={`desktop-nav ${isMenuOpen ? 'desktop-nav--open' : ''}`}
          aria-label="Main navigation"
        >
          <Link to="/shop">Shop</Link>
          <Link
            to="/#categories"
            onClick={(event) => handleSectionNavigation(event, 'categories')}
          >
            Categories
          </Link>

          <Link
            to="/#new-arrivals"
            onClick={(event) => handleSectionNavigation(event, 'new-arrivals')}
          >
            New arrivals
          </Link>

          <Link
            to="/#about"
            onClick={(event) => handleSectionNavigation(event, 'about')}
          >
            Our story
          </Link>

          {user && (
            <Link to="/orders" className="mobile-orders-link">
              <ClipboardList size={18} />
              My Orders
            </Link>
          )}
        </nav>

        <div className="header-actions">
          <Link to="/shop" aria-label="Search products" className="header-search-link">
            <Search size={20} strokeWidth={1.7} />
          </Link>

          {isRestoring ? (
            <button
              type="button"
              aria-label="Restoring account session"
              disabled
            >
              <UserRound size={20} strokeWidth={1.7} />
            </button>
          ) : user ? (
            <div className="header-account" ref={accountMenuRef}>
              <button
                type="button"
                className="header-account-trigger"
                aria-label="Open account menu"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen((open) => !open)}
              >
                <UserRound size={20} strokeWidth={1.7} />
                <span className="header-account-name">
                  {user.firstName}
                </span>
              </button>

              {isAccountMenuOpen && (
                <div className="account-dropdown">
                  <span className="account-dropdown-name">
                    {user.firstName} {user.lastName}
                  </span>

                  <span className="account-dropdown-email">
                    {user.email}
                  </span>

                  <Link to="/orders" className="account-orders-link">
                    <ClipboardList size={17} />
                    My Orders
                  </Link>

                  <button type="button" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              aria-label="Account"
              className="header-account-link"
            >
              <UserRound size={20} strokeWidth={1.7} />
            </Link>
          )}

          <Link
            to="/cart"
            className="header-cart-link"
            aria-label={`Shopping bag, ${itemCount} items`}
            onClick={(event) => {
              if (pathname === '/cart') event.preventDefault()
            }}
          >
            <ShoppingBag size={20} strokeWidth={1.7} />
            {itemCount > 0 && <span>{itemCount}</span>}
          </Link>

          <button
            className="mobile-menu"
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>
    </>
  )
}
