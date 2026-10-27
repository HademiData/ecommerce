
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  CartAction,
  CartItem,
  CartProduct,
  CartState,
} from '../types/cart.types'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: CartProduct) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
}

const STORAGE_KEY = 'ratech-cart'

function loadCart(): CartState {
  try {
    const storedCart = localStorage.getItem(STORAGE_KEY)

    if (!storedCart) return { items: [] }

    const parsed: unknown = JSON.parse(storedCart)

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('items' in parsed) ||
      !Array.isArray(parsed.items)
    ) {
      return { items: [] }
    }

    return {
      items: parsed.items.filter(
        (item): item is CartItem =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.price === 'number' &&
          typeof item.quantity === 'number' &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          typeof item.stock === 'number' &&
          item.quantity <= item.stock &&
          typeof item.category === 'string' &&
          typeof item.sku === 'string' &&
          Array.isArray(item.images) &&
          item.images.every((image: unknown) => typeof image === 'string'),
      ),
    }
  } catch {
    return { items: [] }
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const product = action.product

      if (product.stock <= 0) return state

      const existingItem = state.items.find(
        (item) => item.id === product.id,
      )

      if (existingItem) {
        if (existingItem.quantity >= product.stock) return state

        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        }
      }

      return {
        items: [...state.items, { ...product, quantity: 1 }],
      }
    }

    case 'UPDATE_QUANTITY': {
      const item = state.items.find(
        (item) => item.id === action.productId,
      )

      if (!item) return state

      if (action.quantity <= 0) {
        return {
          items: state.items.filter(
            (item) => item.id !== action.productId,
          ),
        }
      }

      const quantity = Math.min(action.quantity, item.stock)

      return {
        items: state.items.map((item) =>
          item.id === action.productId
            ? { ...item, quantity }
            : item,
        ),
      }
    }

    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(
          (item) => item.id !== action.productId,
        ),
      }

    case 'CLEAR_CART':
      return { items: [] }

    default:
      return state
  }
}

const CartContext = createContext<CartContextValue | undefined>(
  undefined,
)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage may be unavailable or full.
    }
  }, [state])

  const itemCount = state.items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const subtotal = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  const value: CartContextValue = {
    items: state.items,
    itemCount,
    subtotal,
    addItem: (product) => dispatch({ type: 'ADD_ITEM', product }),
    updateQuantity: (productId, quantity) =>
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    removeItem: (productId) =>
      dispatch({ type: 'REMOVE_ITEM', productId }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}