import { useState } from 'react'
import type { HomeProduct } from '../types'
import './NewArrivals.css'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)

type Props = {
  products: HomeProduct[]
  loading: boolean
  error: string
}

const NewArrivals = ({ products, loading, error }: Props) => {
  const [selectedProductId, setSelectedProductId] = useState('')
  const featuredProduct =
    products.find((product) => product._id === selectedProductId) ?? products[0]

  return (
    <section className="new-arrivals" id="new-arrivals">
      <div className="arrivals-header">
        <div>
          <p className="arrivals-eyebrow">THE LATEST FINDS</p>
          <h2>New arrivals.</h2>
          <p className="arrivals-description">
            Discover the essentials shaping everyday living.
          </p>
        </div>

        <a className="arrivals-view-all" href="/shop">
          Explore all products <span aria-hidden="true">↗</span>
        </a>
      </div>

      {loading && <p className="selector-hint" role="status">Loading products...</p>}
      {!loading && error && <p className="selector-hint" role="alert">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="selector-hint">No products are available yet.</p>
      )}

      {featuredProduct && (
        <div className="featured-showcase">
          <article className="featured-product" key={featuredProduct._id}>
            <div className="featured-image-wrap">
              {featuredProduct.images[0] && (
                <img
                  className="featured-image"
                  src={featuredProduct.images[0]}
                  alt={featuredProduct.name}
                />
              )}

              {featuredProduct.badge && (
                <span className="featured-badge">{featuredProduct.badge}</span>
              )}

              <span className="featured-counter">
                {String(products.findIndex(
                  (product) => product._id === featuredProduct._id,
                ) + 1).padStart(2, '0')}
                <span> / </span>
                {String(products.length).padStart(2, '0')}
              </span>
            </div>

            <div className="featured-details">
              <p className="featured-category">{featuredProduct.category}</p>
              <h3>{featuredProduct.name}</h3>
              <p className="featured-description">{featuredProduct.description}</p>
              <p className="featured-price">{formatPrice(featuredProduct.price)}</p>
              <a className="featured-cta" href={`/shop/${featuredProduct._id}`}>
                Discover product <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>

          <aside className="product-selector" aria-label="Choose a featured product">
            <div className="selector-heading">
              <span>EXPLORE THE COLLECTION</span>
              <span>{products.length} PRODUCTS</span>
            </div>

            <div className="selector-list">
              {products.map((product, index) => {
                const isSelected = product._id === featuredProduct._id

                return (
                  <button
                    className={`selector-card${isSelected ? ' is-selected' : ''}`}
                    key={product._id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedProductId(product._id)}
                  >
                    <span className="selector-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {product.images[0] && (
                      <img
                        className="selector-image"
                        src={product.images[0]}
                        alt=""
                        loading="lazy"
                      />
                    )}

                    <span className="selector-info">
                      <span className="selector-category">{product.category}</span>
                      <span className="selector-name">{product.name}</span>
                      <span className="selector-price">{formatPrice(product.price)}</span>
                    </span>

                    <span className="selector-arrow" aria-hidden="true">↗</span>
                  </button>
                )
              })}
            </div>

            <p className="selector-hint">Select a product to explore it.</p>
          </aside>
        </div>
      )}
    </section>
  )
}

export default NewArrivals
