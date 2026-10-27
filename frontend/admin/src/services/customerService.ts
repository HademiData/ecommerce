export type ApiCustomer = {
  id: string
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
  createdAt: string
}

export async function getAdminCustomers(accessToken: string): Promise<ApiCustomer[]> {
  const response = await fetch('/api/users/admin/customers', {
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(response.status === 403
      ? 'Your account does not have permission to view customers.'
      : 'Failed to load customers.')
  }

  const result: unknown = await response.json()
  if (!Array.isArray(result)) {
    throw new Error('The user service returned an invalid response.')
  }

  return result as ApiCustomer[]
}
