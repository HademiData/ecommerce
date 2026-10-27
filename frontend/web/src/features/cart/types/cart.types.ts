export type CartProduct = {
  id: string
  name: string
  price: number
  category: string
  sku: string
  stock: number
  images: string[]
}

export type CartItem = CartProduct & {
  quantity: number
}

export type CartState = {
  items: CartItem[]
}

export type CartAction =
  | { type: 'ADD_ITEM'; product: CartProduct }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'CLEAR_CART' }