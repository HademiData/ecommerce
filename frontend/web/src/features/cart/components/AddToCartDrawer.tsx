
import { Check, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import type { CartProduct } from '../types/cart.types'
import { useCart } from '../context/CartContext'
import './AddToCartDrawer.css'

type AddToCartDrawerProps = {
  product: CartProduct
  onClose: () => void
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)

export default function AddToCartDrawer({
  product,
  onClose,
}: AddToCartDrawerProps) {
  const { items, updateQuantity, removeItem, subtotal } = useCart()
  const [showConfirmation, setShowConfirmation] = useState(true)

  const item = items.find((cartItem) => cartItem.id === product.id)
  const quantity = item?.quantity ?? 0

  return (
    <div className="cart-drawer-layer">
      <button
        className="cart-drawer-backdrop"
        type="button"
        aria-label="Close cart panel"
        onClick={onClose}
      />

      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className="cart-drawer-header">
          <div className="cart-drawer-heading">
            <span className="cart-drawer-icon">
              <ShoppingBag size={19} strokeWidth={1.7} />
            </span>
            <div>
              <h2 id="cart-drawer-title">Your bag</h2>
              <p>{items.reduce((sum, entry) => sum + entry.quantity, 0)} items</p>
            </div>
          </div>

          <button
            className="cart-drawer-close"
            type="button"
            aria-label="Close cart"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </header>

        {showConfirmation && quantity > 0 && (
          <div className="cart-drawer-success" role="status">
            <Check size={17} />
            <span>Added to your bag successfully</span>
            <button
              type="button"
              aria-label="Dismiss confirmation"
              onClick={() => setShowConfirmation(false)}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {quantity > 0 && item ? (
          <div className="cart-drawer-content">
            <div className="cart-drawer-product">
              <div className="cart-drawer-product-image">
                {item.images[0] ? (
                  <img src={item.images[0]} alt={item.name} />
                ) : (
                  <ShoppingBag size={30} strokeWidth={1.3} />
                )}
              </div>

              <div className="cart-drawer-product-info">
                <span>{item.category}</span>
                <h3>{item.name}</h3>
                <strong>{formatPrice(item.price)}</strong>

                <div className="cart-drawer-quantity">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                  >
                    <Minus size={14} />
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= item.stock}
                    onClick={() => updateQuantity(item.id, quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  className="cart-drawer-remove"
                  type="button"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="cart-drawer-summary">
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <p>Delivery is calculated at checkout.</p>

              <a className="cart-drawer-primary" href="/cart">
                View cart
              </a>

              <button
                className="cart-drawer-secondary"
                type="button"
                onClick={onClose}
              >
                Continue shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="cart-drawer-empty">
            <ShoppingBag size={36} strokeWidth={1.3} />
            <h3>Your bag is empty</h3>
            <p>Add something useful to get started.</p>
            <button
              className="cart-drawer-primary"
              type="button"
              onClick={onClose}
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
