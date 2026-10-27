import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { getAdminName, getSession, login, logout } from '../services/authService'

export function useAuth() {
  const [isReady, setIsReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [adminName, setAdminName] = useState('Store Admin')
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const acceptSession = useCallback((session: {
    accessToken: string
    tokenId: string
    user?: { firstName?: string; lastName?: string; email?: string }
  }) => {
    setTokenId(session.tokenId)
    setAccessToken(session.accessToken)
    setAdminName(getAdminName(session))
    setPassword('')
    setLoggedIn(true)
    setLoginError('')
  }, [])

  useEffect(() => {
    let active = true

    getSession()
      .then((session) => {
        if (active) acceptSession(session)
      })
      .catch(() => {
        if (active) {
          setLoggedIn(false)
          setAccessToken(null)
          setTokenId(null)
        }
      })
      .finally(() => {
        if (active) setIsReady(true)
      })

    return () => {
      active = false
    }
  }, [acceptSession])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    setIsSubmitting(true)

    try {
      acceptSession(await login(email, password))
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    const currentTokenId = tokenId
    setLoggedIn(false)
    setTokenId(null)
    setAccessToken(null)
    setPassword('')
    setAdminName('Store Admin')
    setLoginError('')

    if (currentTokenId) {
      try {
        await logout(currentTokenId)
      } catch {
        setLoginError('Could not confirm logout with the server.')
      }
    }
  }

  return {
    isReady,
    loggedIn,
    adminName,
    accessToken,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    isSubmitting,
    handleLogin,
    handleLogout,
  }
}
