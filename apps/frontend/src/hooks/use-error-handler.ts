/**
 * Custom hook for error handling in components
 */

import { useState, useCallback } from 'react'
import { AppError, handleError, classifyError } from '@/lib/error-handler'

export interface UseErrorHandlerReturn {
  error: AppError | null
  setError: (error: Error | AppError | null) => void
  clearError: () => void
  handleError: (error: any, showToast?: boolean) => AppError
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<AppError | null>(null)

  const setError = useCallback((error: Error | AppError | null) => {
    if (error === null) {
      setErrorState(null)
    } else {
      const appError = classifyError(error)
      setErrorState(appError)
    }
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  const handleErrorCallback = useCallback((error: any, showToast: boolean = true) => {
    const appError = handleError(error, showToast)
    setErrorState(appError)
    return appError
  }, [])

  return {
    error,
    setError,
    clearError,
    handleError: handleErrorCallback,
  }
}
