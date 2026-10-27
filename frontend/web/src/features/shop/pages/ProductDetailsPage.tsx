
import { useEffect, useState } from 'react'
import { PackageSearch } from 'lucide-react'
import Header from '../../../components/layout/Header'

import { useCart } from '../../cart/context/CartContext'

import './ProductDetailsPage.css'

import { useParams } from 'react-router-dom'

import AddToCartDrawer from '../../cart/components/AddToCartDrawer'
import type { CartProduct } from '../../cart/types/cart.types'

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

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)

export default function ProductDetailsPage() {

  const [cartDrawerProduct, setCartDrawerProduct] =
  useState<CartProduct | null>(null)

  const { addItem } = useCart()
  const { productId = '' } = useParams()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {

    const controller = new AbortController()

    async function loadProduct() {
      try {
        const response = await fetch(`${API_URL}/${productId}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'This product could not be found.'
              : 'Unable to load this product.',
          )
        }

        const result: Product = await response.json()
        setProduct(result)
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

    void loadProduct()

    return () => controller.abort()
  }, [productId])

  return (
    <>
      <Header />

      <main className="product-details-page">
        {loading ? (
          <p className="product-details-message" role="status">
            Loading product...
          </p>
        ) : error ? (
          <div className="product-details-message" role="alert">
            <h1>Product unavailable</h1>
            <p>{error}</p>
            <a href="/shop">Back to shop</a>
          </div>
        ) : product ? (
          <section className="product-details-layout">
            <div className="product-details-image">
              {product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} />
              ) : (
                <div className="product-details-placeholder">
                  <PackageSearch size={64} strokeWidth={1.2} />
                  <span>RÀTECH ESSENTIALS</span>
                </div>
              )}
            </div>

            <div className="product-details-info">
              <a className="product-back-link" href="/shop">
                ← Back to shop
              </a>

              <p className="product-details-category">{product.category}</p>
              <h1>{product.name}</h1>
              <p className="product-details-price">
                {formatPrice(product.price)}
              </p>
              <p className="product-details-description">
                {product.description}
              </p>

              <p className="product-details-stock">
                {product.stock > 0
                  ? `${product.stock} available`
                  : 'Currently out of stock'}
              </p>

              <button
  className="product-add-button"
  type="button"
  disabled={product.stock === 0}
  onClick={() => {
    const cartProduct: CartProduct = {
      id: product._id,
      name: product.name,
      price: product.price,
      category: product.category,
      sku: product.sku,
      stock: product.stock,
      images: product.images ?? [],
    }

    addItem(cartProduct)
    setCartDrawerProduct(cartProduct)
  }}
>
  {product.stock === 0 ? 'Out of stock' : 'Add to bag'}
</button>

{cartDrawerProduct && (
  <AddToCartDrawer
    product={cartDrawerProduct}
    onClose={() => setCartDrawerProduct(null)}
  />
)}

              <p className="product-details-sku">SKU: {product.sku}</p>
            </div>
          </section>
        ) : null}
      </main>
    </>
  )
}
