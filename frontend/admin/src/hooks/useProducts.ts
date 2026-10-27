import { useCallback, useEffect, useState } from 'react'
import { getProducts } from '../services/productService'
import type { Product } from '../types'

export function useProducts(enabled: boolean) {
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  const refreshProducts = useCallback(() => {
    setRefreshVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let active = true

    async function load() {
      setProductsLoading(true)
      setProductsError('')
      try {
        const result = await getProducts()
        if (active) setProducts(result.data)
      } catch (error) {
        if (active) setProductsError(error instanceof Error ? error.message : 'Failed to load products.')
      } finally {
        if (active) setProductsLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [enabled, refreshVersion])

  return { products, productsLoading, productsError, refreshProducts }
}
