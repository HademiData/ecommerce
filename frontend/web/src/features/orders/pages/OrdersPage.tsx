import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import Header from '../../../components/layout/Header'
import { useAuth } from '../../auth/context/AuthContext'


import './OrdersPage.css'

type OrderItem = {
  id?: string
  productId: string
  name: string
  quantity: number
  unitPrice: number | string
}

type Order = {
  id: string
  status: string
  totalAmount: number | string
  createdAt: string
  items: OrderItem[]
}

const formatPrice = (price: number | string) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(price))

export default function OrdersPage() {
  const { accessToken, isRestoring } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [message, setMessage] = useState('')
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  )
  const [refreshKey, setRefreshKey] = useState(0)

  const loadOrders = useCallback(
    async (signal?: AbortSignal) => {
      if (!accessToken) {
        setError('Please log in to view your orders.')
        setLoading(false)
        return
      }

      try {
        setError('')

        const response = await fetch('/api/orders', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal,
        })

        const data: unknown = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error('Unable to load your orders. Please try again.')
        }

        if (!signal?.aborted) {
          setOrders(Array.isArray(data) ? (data as Order[]) : [])
        }
      } catch (err) {
        if (signal?.aborted) return

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading your orders.',
        )
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [accessToken],
  )

  useEffect(() => {
    if (isRestoring) return

    const controller = new AbortController()

    if (!accessToken) {
      setError('Please log in to view your orders.')
      setLoading(false)
      return () => controller.abort()
    }

    setLoading(true)
    void loadOrders(controller.signal)

    return () => controller.abort()
  }, [accessToken, isRestoring, loadOrders, refreshKey])

  async function cancelOrder(orderId: string) {
    if (!accessToken || cancellingOrderId) return

    const confirmed = window.confirm(
      'Are you sure you want to cancel this order?',
    )

    if (!confirmed) return

    setCancellingOrderId(orderId)
    setCancelError('')
    setMessage('')

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const errorMessage =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : 'Unable to cancel this order. Please try again.'

        throw new Error(errorMessage)
      }

      setMessage('Order cancelled successfully.')
      setRefreshKey((key) => key + 1)
    } catch (err) {
      setCancelError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while cancelling your order.',
      )
    } finally {
      setCancellingOrderId(null)
    }
  }

  
return (
  <>
    <Header />

    <main className="orders-page">
      <header className="orders-heading">
        <p className="orders-eyebrow">YOUR ACCOUNT / PURCHASES</p>
        <h1>My orders</h1>
        <p className="orders-subtitle">
          Track your purchases and manage your orders.
        </p>
      </header>

      {message && (
        <p className="orders-message orders-message--success" role="status">
          {message}
        </p>
      )}

      {cancelError && (
        <p className="orders-message orders-message--error" role="alert">
          {cancelError}
        </p>
      )}

      {loading ? (
        <p>Loading your orders...</p>
      ) : error ? (
        <section className="orders-empty" role="alert">
          <h2>Unable to load orders</h2>
          <p>{error}</p>
          <Link className="cart-primary-button" to="/login">
            Log in
          </Link>
        </section>
      ) : orders.length === 0 ? (
        <section className="orders-empty">
          <ShoppingBag size={40} strokeWidth={1.3} />
          <h2>No orders yet</h2>
          <p>Your purchases will appear here after checkout.</p>
          <Link className="cart-primary-button" to="/shop">
            Explore products
          </Link>
        </section>
      ) : (
        <section className="orders-list" aria-label="Your orders">
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <header className="order-card-header">
                <div>
                  <p className="order-reference">ORDER #{order.id}</p>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <span
                  className={`order-status ${
                    order.status === 'CONFIRMED'
                      ? 'order-status--confirmed'
                      : order.status === 'PENDING'
                        ? 'order-status--pending'
                        : order.status === 'CANCELLED'
                          ? 'order-status--cancelled'
                          : ''
                  }`}
                >
                  {order.status}
                </span>
              </header>

              <div className="order-products">
                {order.items?.map((item, index) => (
                  <div
                    className="order-product"
                    key={item.id ?? `${item.productId}-${index}`}
                  >
                    <div>
                      <p className="order-product-name">{item.name}</p>
                      <p className="order-product-quantity">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <span className="order-product-price">
                      {formatPrice(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <footer className="order-card-footer">
                <div>
                  <p className="order-total-label">Order total</p>
                  <p className="order-total">
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>

                {order.status === 'PENDING' && (
                  <button
                    type="button"
                    className="order-cancel-button"
                    disabled={cancellingOrderId !== null}
                    onClick={() => void cancelOrder(order.id)}
                  >
                    {cancellingOrderId === order.id
                      ? 'Cancelling...'
                      : 'Cancel order'}
                  </button>
                )}
              </footer>
            </article>
          ))}
        </section>
      )}
    </main>
  </>
)
}