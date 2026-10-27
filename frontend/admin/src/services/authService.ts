type Session = {
  accessToken: string
  tokenId: string
  user?: { firstName?: string; lastName?: string; email?: string }
}

let sessionRequest: Promise<Session> | null = null

async function readJson(response: Response) {
  return response.json().catch(() => null)
}

export async function login(email: string, password: string): Promise<Session> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const session = await readJson(response)

  if (!response.ok) {
    throw new Error(typeof session?.message === 'string' ? session.message : 'Invalid email or password.')
  }

  if (typeof session?.accessToken !== 'string' || typeof session?.tokenId !== 'string') {
    throw new Error('The server returned an invalid login response.')
  }

  await verifyAdmin(session.accessToken, session.tokenId)
  return session
}

export async function verifyAdmin(accessToken: string, tokenId?: string) {
  const response = await fetch('/api/users/admin', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    if (tokenId) await logout(tokenId).catch(() => undefined)
    if (response.status === 401 || response.status === 403) {
      throw new Error('This account does not have admin access.')
    }
    throw new Error('Could not verify admin access. Please try again.')
  }
}

async function restoreSession(): Promise<Session> {
  const response = await fetch('/api/auth/session', { credentials: 'include' })
  const session = await response.json().catch(() => null)

  if (!response.ok || typeof session?.accessToken !== 'string' || typeof session?.tokenId !== 'string') {
    throw new Error('No active admin session.')
  }

  await verifyAdmin(session.accessToken, session.tokenId)
  return session
}

export function getSession(): Promise<Session> {
  if (!sessionRequest) {
    sessionRequest = restoreSession().finally(() => {
      sessionRequest = null
    })
  }
  return sessionRequest
}

export async function logout(tokenId: string) {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId }),
  })
  if (!response.ok) throw new Error('Could not confirm logout with the server.')
}

export function getAdminName(session: {
  user?: { firstName?: string; lastName?: string; email?: string }
}) {
  return [session.user?.firstName, session.user?.lastName].filter(Boolean).join(' ')
    || session.user?.email
    || 'Store Admin'
}
