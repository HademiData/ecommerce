
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '../types/auth.types'

const AUTH_URL = '/api/auth'

async function request<T>(
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${AUTH_URL}/${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data
        ? data.message
        : 'Something went wrong. Please try again.'

    throw new Error(
      Array.isArray(message) ? message.join(', ') : String(message),
    )
  }

  return data as T
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthSession>('login', payload),

  getSession: () =>
    request<AuthSession>('session'),

  register: (payload: RegisterPayload) =>
    request<AuthUser>('register', payload),

  verifyEmail: (userId: string, otp: string) =>
    request<{ verified: boolean }>('verify-email', { userId, otp }),

  resendVerification: (email: string) =>
    request<unknown>('resend-verification', { email }),

  logout: (tokenId: string) =>
    request<{ message: string }>('logout', { tokenId }),
}
