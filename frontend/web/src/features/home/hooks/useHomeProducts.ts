import { useEffect, useState } from 'react'
import type { HomeProduct, HomeProductResponse } from '../types'

export function useHomeProducts() {
  const [products, setProducts] = useState<HomeProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const response = await fetch(
          '/api/products?limit=100&sortBy=createdAt&order=desc',
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Unable to load products.')
        }

        const result: HomeProductResponse = await response.json()
        if (!Array.isArray(result.data)) {
          throw new Error('The product service returned an invalid response.')
        }

        setProducts(
          result.data.filter(
            (product) =>
              Array.isArray(product.images) &&
              product.images.some((image) => image.trim().length > 0),
          ),
        )
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name !== 'AbortError') {
          setError(loadError.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadProducts()
    return () => controller.abort()
  }, [])

  return { products, loading, error }
}
