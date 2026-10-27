export type ApiOrder = {
  id: string
  userId: string
  status: string
  totalAmount: string | number
  createdAt: string
  items?: Array<{
    id: string
    productId: string
    name: string
    quantity: number
    unitPrice: string | number
  }>
}

export async function getAdminOrders(accessToken: string): Promise<ApiOrder[]> {
  const response = await fetch('/api/orders/admin', {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(response.status === 403
      ? 'Your account does not have permission to view all orders.'
      : 'Failed to load orders.')
  }

  const result: unknown = await response.json()
  if (!Array.isArray(result)) {
    throw new Error('The order service returned an invalid response.')
  }

  return result as ApiOrder[]
}
