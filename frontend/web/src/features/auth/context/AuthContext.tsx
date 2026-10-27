
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api/authApi'
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
} from '../types/auth.types'

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isRestoring: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

let restorationRequest: Promise<AuthSession | null> | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)
  const sessionVersion = useRef(0)

  const restoreSession = useCallback(async (): Promise<boolean> => {
    const version = sessionVersion.current
    setIsRestoring(true)

    if (!restorationRequest) {
      restorationRequest = authApi
        .getSession()
        .catch(() => null)
        .finally(() => {
          restorationRequest = null
        })
    }

    const result = await restorationRequest

    if (version !== sessionVersion.current) {
      return false
    }

    setSession(result)
    setIsRestoring(false)

    return result !== null
  }, [])

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  async function login(payload: LoginPayload) {
    const result = await authApi.login(payload)

    sessionVersion.current += 1
    setSession(result)
    setIsRestoring(false)
  }

  async function logout() {
    const currentSession = session

    sessionVersion.current += 1
    setSession(null)
    setIsRestoring(false)

    if (currentSession) {
      await authApi.logout(currentSession.tokenId)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        accessToken: session?.accessToken ?? null,
        isRestoring,
        login,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
