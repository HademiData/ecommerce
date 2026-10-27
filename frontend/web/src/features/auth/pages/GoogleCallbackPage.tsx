
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function GoogleCallbackPage() {
  const { restoreSession } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    async function completeGoogleLogin() {
      try {
        await restoreSession()

        if (!active) return

        navigate('/', { replace: true })
      } catch {
        if (active) setError(true)
      }
    }

    void completeGoogleLogin()

    return () => {
      active = false
    }
  }, [restoreSession, navigate])

  if (error) {
    return (
      <main className="auth-page">
        <p>Google sign-in could not be completed.</p>
        <button onClick={() => navigate('/login', { replace: true })}>
          Return to login
        </button>
      </main>
    )
  }

  return <main className="auth-page"><p>Signing you in…</p></main>
}
