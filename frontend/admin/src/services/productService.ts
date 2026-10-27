import type { ProductResponse } from '../types'

export type NewProduct = {
  name: string
  description: string
  price: number
  category: string
  sku: string
  stock: number
  images: string[]
  badge?: string
}

export async function getProducts(): Promise<ProductResponse> {
  const response = await fetch('/api/products?limit=100', { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to load products.')
  const result = await response.json()

  if (!Array.isArray(result?.data)) {
    throw new Error('The product service returned an invalid response.')
  }

  return result as ProductResponse
}

export async function createProduct(accessToken: string, product: NewProduct): Promise<void> {
  await saveProduct('/api/products', 'POST', accessToken, product)
}

export async function updateProduct(
  accessToken: string,
  id: string,
  product: NewProduct,
): Promise<void> {
  await saveProduct(`/api/products/${encodeURIComponent(id)}`, 'PATCH', accessToken, product)
}

async function saveProduct(
  url: string,
  method: 'POST' | 'PATCH',
  accessToken: string,
  product: NewProduct,
): Promise<void> {
  const response = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(product),
  })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const message = typeof result?.message === 'string'
      ? result.message
      : Array.isArray(result?.message)
        ? result.message.join(' ')
        : response.status === 403
          ? 'Your account does not have permission to save products.'
          : 'Failed to save product.'
    throw new Error(message)
  }

  if (typeof result?._id !== 'string') {
    throw new Error('The product service returned an invalid product.')
  }
}

export async function deleteProduct(accessToken: string, id: string): Promise<void> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const message = typeof result?.message === 'string'
      ? result.message
      : Array.isArray(result?.message)
        ? result.message.join(' ')
        : response.status === 403
          ? 'Your account does not have permission to delete products.'
          : 'Failed to delete product.'
    throw new Error(message)
  }
}
