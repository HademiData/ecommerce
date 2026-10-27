
import { useHomeProducts } from '../hooks/useHomeProducts'
import Header from '../../../components/layout/Header'
import HeroSection from '../components/HeroSection'
import CategorySection from '../components/CategorySection'
import NewArrivals from '../components/NewArrivals'
import BrandStory from '../components/BrandStory'


import './HomePage.css'



const HomePage = () => {
  const { products, loading, error } = useHomeProducts()

  return (
    <>
      <Header />

      <main>
        <HeroSection products={products} />
        <CategorySection products={products} />
        <NewArrivals products={products} loading={loading} error={error} />
        <BrandStory />
      </main>

      <footer className="site-footer">
  <div className="footer-container">
    <div className="footer-main">
      <div className="footer-brand">
        <a href="/" className="footer-logo" aria-label="Ràtech home">
          Rà<span>tech</span><span className="footer-logo-dot">.</span>
        </a>

        <p className="footer-tagline">
          Technology for everyday life.
        </p>

        <p className="footer-description">
          Discover thoughtfully selected gadgets, accessories,
          and everyday essentials designed to make life better.
        </p>
      </div>

      <nav className="footer-column" aria-label="Shop">
        <h2>Shop</h2>
        <a href="/shop">All products</a>
        <a href="/shop?category=mobile-audio">Mobile &amp; Audio</a>
        <a href="/shop?category=computing">Computing</a>
        <a href="/shop?category=home-kitchen">Home &amp; Kitchen</a>
        <a href="/shop?category=power-essentials">Power essentials</a>
      </nav>

      <nav className="footer-column" aria-label="Customer support">
        <h2>Support</h2>
        <a href="/contact">Contact us</a>
        <a href="/faq">Frequently asked questions</a>
        <a href="/shipping">Shipping information</a>
        <a href="/returns">Returns &amp; refunds</a>
      </nav>

      <nav className="footer-column" aria-label="Your account">
        <h2>Your account</h2>
        <a href="/login">Sign in</a>
        <a href="/register">Create an account</a>
        <a href="/orders">Track your orders</a>
        <a href="/cart">Shopping cart</a>
      </nav>
    </div>

    <div className="footer-bottom">
      <p className="footer-copyright">
        © {new Date().getFullYear()} Ràtech. All rights reserved.
      </p>

      <p className="footer-bottom-tagline">
        Made for everyday living.
      </p>

      <div className="footer-legal">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </div>
    </div>
  </div>
</footer>
    </>
  )
}

export default HomePage
