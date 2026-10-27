
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { authApi } from '../api/authApi'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const userId = searchParams.get('userId') ?? ''
  const email = searchParams.get('email') ?? ''

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const result = await authApi.verifyEmail(userId, otp)

      if (!result.verified) {
        throw new Error('Verification failed. Check your code.')
      }

      setSuccess('Email verified. You can now sign in.')
      navigate('/login', { replace: true })
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Verification failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setSuccess('')

    try {
      await authApi.resendVerification(email)
      setSuccess('A new verification code has been requested.')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not resend the code.',
      )
    }
  }

  if (!userId || !email) {
    return (
      <AuthLayout
        eyebrow="Email verification"
        title="Let's find your account."
        description="Register first to receive your email verification code."
      >
        <p className="auth-switch">
          <Link to="/register">Create an account</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="One last step"
      title="Verify your email."
      description={`Enter the six-digit code for ${email}.`}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label htmlFor="verification-code">Verification code</label>
          <input
            id="verification-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
            }
            required
          />
        </div>

        {error && <p className="auth-message" role="alert">{error}</p>}
        {success && <p className="auth-message auth-message--success">{success}</p>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <p className="auth-switch">
        Didn't receive a code?{' '}
        <button type="button" onClick={handleResend}>
          Resend code
        </button>
      </p>
    </AuthLayout>
  )
}
