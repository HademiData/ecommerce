import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './NavigationLoader.css'

export default function NavigationLoader() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  const previousLocation = useRef(
    `${location.pathname}${location.search}${location.hash}`,
  )

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return

      const link = target.closest('a[href]')
      if (!(link instanceof HTMLAnchorElement)) return
      if (link.target === '_blank' || link.hasAttribute('download')) return

      const destination = new URL(link.href, window.location.href)

      if (destination.origin !== window.location.origin) return

      const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash

      const nextPath =
        destination.pathname + destination.search + destination.hash

      const isHomepageSection =
        destination.pathname === '/' &&
        ['#categories', '#new-arrivals', '#about'].includes(
          destination.hash,
        )

      if (isHomepageSection) {
        setIsLoading(false)
        return
      }

      if (nextPath !== currentPath) {
        setIsLoading(true)
      }
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  useEffect(() => {
    const nextLocation =
      `${location.pathname}${location.search}${location.hash}`

    if (nextLocation === previousLocation.current) return

    previousLocation.current = nextLocation

    const isHomepageSection =
      location.pathname === '/' &&
      ['#categories', '#new-arrivals', '#about'].includes(
        location.hash,
      )

    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }

    if (isHomepageSection) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    timer.current = setTimeout(() => {
      setIsLoading(false)
      timer.current = null
    }, 400)

    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div
      className="navigation-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="navigation-loader__content">
        <div className="navigation-loader__brand">
          Rà<span>tech</span>
          <span className="navigation-loader__dot">.</span>
        </div>

        <div className="navigation-loader__spinner" />

        <p>Preparing your experience</p>
      </div>
    </div>
  )
}