
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../../components/layout/Header'
import './AuthLayout.css'

type Props = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: Props) {
  return (
    <>
      <Header />

      <main className="auth-page">
        <section className="auth-panel">
          <Link to="/" className="auth-brand">
            Rà<span>tech</span>.
          </Link>

          <p className="auth-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>

          {children}

          <p className="auth-footer">
            Technology for everyday life.
          </p>
        </section>
      </main>
    </>
  )
}
