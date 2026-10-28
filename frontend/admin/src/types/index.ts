export type Page = 'Dashboard' | 'Customers' | 'Products' | 'Orders' | 'Analytics' | 'Discounts'

export type Product = {
  _id: string
  name: string
  category: string
  price: number
  stock: number
  sku: string
  isActive: boolean
  description?: string
  images?: string[]
  badge?: string
}

export type ProductResponse = {
  data: Product[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type Order = {
  id: string
  customer: string
  date: string
  amount: string
  status: string
  items: OrderItem[]
}

export type OrderItem = {
  id: string
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export type Customer = {
  id: string
  name: string
  email: string
  orders: number
  spent: string
  createdAt: string
  emailVerified: boolean
}
