import { useEffect, useState } from 'react'

import type { FormEvent } from 'react'
import { PackageSearch, Search } from 'lucide-react'
import Header from '../../../components/layout/Header'
import './ShopPage.css'

const API_URL = '/api/products'


type Product = {
  _id: string
  name: string
  description: string
  price: number
  category: string
  sku: string
  stock: number
  images: string[]
}

type ProductResponse = {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] =
    useState<ProductResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        sortBy,
        order,
      })

      if (search) params.set('search', search)
      if (category) params.set('category', category)

      try {
        const response = await fetch(`${API_URL}?${params}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load products.')
        }

        const result: ProductResponse = await response.json()

        setProducts(result.data)
        setPagination(result.pagination)

        setCategories((current) => {
          const next = new Set(current)
          result.data.forEach((product) => next.add(product.category))
          return [...next].sort()
        })
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadProducts()

    return () => controller.abort()
  }, [page, search, category, sortBy, order])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function changeCategory(value: string) {
    setCategory(value)
    setPage(1)
  }

  function changeSort(value: string) {
    const [nextSort, nextOrder] = value.split('-')
    setSortBy(nextSort)
    setOrder(nextOrder)
    setPage(1)
  }

  return (
    <>
      <Header />

      <main className="shop-page">
        <section className="shop-intro">
          <p className="shop-eyebrow">THE RÀTECH COLLECTION</p>
          <h1>Find your next essential.</h1>
          <p>
            Thoughtfully selected technology, accessories, and everyday
            essentials.
          </p>
        </section>

        <section className="shop-content" aria-label="Shop products">
          <div className="shop-toolbar">
            <form className="shop-search" onSubmit={submitSearch}>
              <Search size={19} aria-hidden="true" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
              />

              <button type="submit">Search</button>
            </form>

            <div className="shop-filters">
              <label>
                <span>Category</span>
                <select
                  value={category}
                  onChange={(event) => changeCategory(event.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Sort by</span>
                <select
                  value={`${sortBy}-${order}`}
                  onChange={(event) => changeSort(event.target.value)}
                >
                  <option value="createdAt-desc">Newest first</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </label>
            </div>
          </div>

          <div className="shop-results-heading">
            <h2>All products</h2>
            {!loading && pagination && (
              <span>
                {pagination.total}{' '}
                {pagination.total === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="shop-message" role="status">
              Loading products...
            </div>
          ) : error ? (
            <div className="shop-message shop-error" role="alert">
              <h3>We couldn't load the products.</h3>
              <p>{error}</p>
              <p>
                Check that the API Gateway is running on port 3003 and that
                the browser can access it.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="shop-message shop-empty">
              <PackageSearch size={36} strokeWidth={1.4} />
              <h3>No products found</h3>
              <p>Try another search or clear your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setCategory('')
                  setPage(1)
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="shop-product-grid">
                {products.map((product) => (
                  <article
                    className="shop-product-card"
                    key={product._id}
                    onClick={() => {
                        window.location.href = `/shop/${product._id}`
                    }}
                    style={{ cursor: 'pointer' }}
                    >
                    <div className="shop-product-image">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="shop-image-placeholder">
                          <PackageSearch
                            size={42}
                            strokeWidth={1.2}
                            aria-hidden="true"
                          />
                          <span>RÀTECH ESSENTIALS</span>
                        </div>
                      )}

                      {product.stock === 0 && (
                        <span className="shop-stock-badge">Out of stock</span>
                      )}
                    </div>

                    <div className="shop-product-info">
                      <p className="shop-product-category">
                        {product.category}
                      </p>
                      <h3>{product.name}</h3>
                      <p className="shop-product-description">
                        {product.description}
                      </p>

                      <div className="shop-product-bottom">
                        <strong>{formatPrice(product.price)}</strong>
                        <span>
                          {product.stock > 0 ? 'In stock' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <nav className="shop-pagination" aria-label="Product pages">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
      
    </>
  )
}