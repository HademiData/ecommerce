
import { useAuth } from '../../auth/context/AuthContext'
import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Header from '../../../components/layout/Header'
import { useCart } from '../context/CartContext'
import './CartPage.css'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)

type CreatedOrder = {
  id?: string
  status?: string
  order?: {
    id?: string
    status?: string
  }
}

function getErrorMessage(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = data.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (typeof message === 'string') {
      return message
    }
  }

  return 'Checkout failed. Please try again.'
}

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()

  const { accessToken } = useAuth()

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState('')
  const [createdOrder, setCreatedOrder] = useState<{
    id: string
    status: string
  } | null>(null)

  async function handleCheckout() {
    if (items.length === 0 || isCheckingOut) return

    if (!accessToken) {
      setError('Your session has expired. Please log in again.')
      return
    }

    setIsCheckingOut(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(getErrorMessage(data))
      }

      const order = (data ?? {}) as CreatedOrder

      setCreatedOrder({
        id: order.id ?? order.order?.id ?? '',
        status: order.status ?? order.order?.status ?? 'PENDING',
      })

      clearCart()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <>
      <Header />

      <main className="cart-page">
        <div className="cart-heading">
          <p className="cart-eyebrow">YOUR SELECTION</p>
          <h1>Your cart</h1>
          <p>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag
          </p>
        </div>

        {createdOrder ? (
          <section className="cart-empty" aria-live="polite">
            <ShoppingBag size={48} strokeWidth={1.3} />
            <h2>Order created successfully</h2>
            <p>
              Your order has been submitted. Its current status is{' '}
              <strong>{createdOrder.status}</strong>.
            </p>
            {createdOrder.id && (
              <p>
                Order reference: <strong>{createdOrder.id}</strong>
              </p>
            )}
            <a className="cart-primary-button" href="/shop">
              Continue shopping
            </a>
          </section>
        ) : items.length === 0 ? (
          <section className="cart-empty">
            <ShoppingBag size={48} strokeWidth={1.3} />
            <h2>Your cart is empty</h2>
            <p>Find something useful for your everyday life.</p>
            <a className="cart-primary-button" href="/shop">
              Explore products
            </a>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items" aria-label="Cart items">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-image">
                    {item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.name} />
                    ) : (
                      <ShoppingBag size={32} strokeWidth={1.3} />
                    )}
                  </div>

                  <div className="cart-item-details">
                    <p className="cart-item-category">{item.category}</p>
                    <h2>{item.name}</h2>
                    <p className="cart-item-price">
                      {formatPrice(item.price)}
                    </p>

                    <div className="cart-item-actions">
                      <div
                        className="cart-quantity"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus size={15} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="cart-remove-button"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong className="cart-item-total">
                    {formatPrice(item.price * item.quantity)}
                  </strong>
                </article>
              ))}
            </section>

            <aside className="cart-summary">
              <h2>Order summary</h2>

              <div className="cart-summary-row">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="cart-summary-row">
                <span>Delivery</span>
                <span>Calculated later</span>
              </div>

              <div className="cart-summary-total">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              {error && (
                <p role="alert" className="cart-checkout-error">
                  {error}
                </p>
              )}

              <button
                className="cart-primary-button cart-checkout-button"
                type="button"
                disabled={isCheckingOut}
                onClick={handleCheckout}
              >
                {isCheckingOut ? 'Creating order...' : 'Checkout'}
              </button>

              <a className="cart-continue-link" href="/shop">
                Continue shopping
              </a>
            </aside>
          </div>
        )}
      </main>
    </>
  )
}