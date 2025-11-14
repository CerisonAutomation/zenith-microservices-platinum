/**
 * Custom hook for form validation with real-time validation
 */

import { useState, useCallback } from 'react'
import { z } from 'zod'
import {
  validateForm,
  FormErrors,
  FieldError,
  clearFieldError,
  hasFormErrors,
} from '@/lib/form-validation'

export interface UseFormValidationReturn<T> {
  errors: FormErrors<T>
  validateAll: (data: unknown) => boolean
  validateField: (field: keyof T, value: any) => FieldError | undefined
  clearError: (field: keyof T) => void
  clearAllErrors: () => void
  hasErrors: boolean
}

export function useFormValidation<T>(
  schema: z.ZodSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<FormErrors<T>>({})

  const validateAll = useCallback(
    (data: unknown): boolean => {
      const result = validateForm(schema, data)
      setErrors(result.errors || {})
      return result.success
    },
    [schema]
  )

  const validateField = useCallback(
    (field: keyof T, value: any): FieldError | undefined => {
      try {
        // Create a partial schema for the field
        const fieldSchema = (schema as any).shape?.[field]
        if (!fieldSchema) return undefined

        fieldSchema.parse(value)

        // Clear error for this field
        setErrors((prev) => clearFieldError(prev, field))
        return undefined
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError: FieldError = {
            message: error.errors[0].message,
            type: error.errors[0].code,
          }
          setErrors((prev) => ({ ...prev, [field]: fieldError }))
          return fieldError
        }
        return undefined
      }
    },
    [schema]
  )

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => clearFieldError(prev, field))
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  return {
    errors,
    validateAll,
    validateField,
    clearError,
    clearAllErrors,
    hasErrors: hasFormErrors(errors),
  }
}
