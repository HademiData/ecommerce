import { ChevronRight } from 'lucide-react'
import type { FormEvent } from 'react'

type Props = {
  email: string
  setEmail: (value: string) => void
  password: string
  setPassword: (value: string) => void
  error: string
  isSubmitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function LoginPage({ email, setEmail, password, setPassword, error, isSubmitting, onSubmit }: Props) {
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <a className="brand login-brand" href="/">Ràtech<span>.</span></a>
        <div className="login-brand-copy">
          <span className="eyebrow">THE CONTROL ROOM</span>
          <h1>Your store.<br />Under control.</h1>
          <p>Manage products, understand customers, and keep your business moving from one place.</p>
        </div>
        <div className="login-bottom"><span className="brand-mark">R.</span><span>Ràtech commerce management</span></div>
      </section>
      <section className="login-form-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <span className="eyebrow">ADMINISTRATION</span>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to access your store dashboard.</p>
          <label htmlFor="admin-email">Email address</label>
          <input id="admin-email" type="email" placeholder="admin@ratech.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          {error && <p className="login-notice" role="alert">{error}</p>}
          <button className="primary-button login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}{!isSubmitting && <ChevronRight size={18} />}</button>
          <p className="login-notice">Admin access is verified by the server.</p>
        </form>
        <span className="login-footer">© 2026 Ràtech. Internal use only.</span>
      </section>
    </main>
  )
}
