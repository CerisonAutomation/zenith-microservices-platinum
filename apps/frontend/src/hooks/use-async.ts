/**
 * Custom hook for handling async operations with loading and error states
 */

import { useState, useCallback } from 'react'
import { AppError, handleError } from '@/lib/error-handler'

export interface UseAsyncReturn<T> {
  data: T | null
  loading: boolean
  error: AppError | null
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(immediate)
  const [error, setError] = useState<AppError | null>(null)

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true)
      setError(null)

      try {
        const result = await asyncFunction(...args)
        setData(result)
        return result
      } catch (err: any) {
        const appError = handleError(err)
        setError(appError)
        return null
      } finally {
        setLoading(false)
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}
