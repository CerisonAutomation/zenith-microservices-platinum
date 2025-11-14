# Comprehensive Error Handling & Loading States Guide

This document describes the complete error handling and loading state implementation throughout the Zenith Dating application.

## Table of Contents

1. [Error Boundaries](#error-boundaries)
2. [Loading States](#loading-states)
3. [Error Handling Utilities](#error-handling-utilities)
4. [Form Validation](#form-validation)
5. [Network Error Handling](#network-error-handling)
6. [Custom Hooks](#custom-hooks)
7. [UI Components](#ui-components)
8. [Best Practices](#best-practices)

## Error Boundaries

### Global Error Boundary

**Location:** `/apps/frontend/src/app/error.tsx`

The global error boundary catches unhandled errors at the root level and displays a user-friendly error page.

**Features:**
- Logs errors to console (development) and error tracking service (production)
- Shows error details in development mode
- Provides "Try Again" and "Go Home" actions
- Integrates with Sentry or other error tracking services

### Route-Specific Error Boundaries

Error boundaries have been added to all major routes:

- `/apps/frontend/src/app/error.tsx` - Global root error
- `/apps/frontend/src/app/(app)/error.tsx` - App section error
- `/apps/frontend/src/app/(app)/home/error.tsx` - Home page error
- `/apps/frontend/src/app/(app)/bookings/error.tsx` - Bookings error
- `/apps/frontend/src/app/(app)/bookings/create/error.tsx` - Create booking error
- `/apps/frontend/src/app/(app)/profile/[id]/error.tsx` - Profile page error
- `/apps/frontend/src/app/(app)/explore/error.tsx` - Explore page error
- `/apps/frontend/src/app/(app)/favorites/error.tsx` - Favorites error
- `/apps/frontend/src/app/(app)/messages/error.tsx` - Messages error
- `/apps/frontend/src/app/(app)/notifications/error.tsx` - Notifications error
- `/apps/frontend/src/app/(app)/wallet/error.tsx` - Wallet error
- `/apps/frontend/src/app/(app)/nearby/error.tsx` - Nearby error
- `/apps/frontend/src/app/(app)/dashboard/error.tsx` - Dashboard error
- `/apps/frontend/src/app/(auth)/error.tsx` - Auth error

### React Error Boundary Component

**Location:** `/apps/frontend/src/components/error-boundary.tsx`

A reusable class component for wrapping sections that need error handling:

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary onError={(error, errorInfo) => {
  // Custom error handling
}}>
  <YourComponent />
</ErrorBoundary>
```

## Loading States

### Global Loading State

**Location:** `/apps/frontend/src/app/loading.tsx`

Displays while the application is initializing.

### Route-Specific Loading States

Loading screens with skeleton UI have been added to all major routes:

- `/apps/frontend/src/app/loading.tsx` - Global root loading
- `/apps/frontend/src/app/(app)/loading.tsx` - App section loading
- `/apps/frontend/src/app/(app)/home/loading.tsx` - Home page loading
- `/apps/frontend/src/app/(app)/bookings/loading.tsx` - Bookings loading
- `/apps/frontend/src/app/(app)/bookings/create/loading.tsx` - Create booking loading
- `/apps/frontend/src/app/(app)/profile/loading.tsx` - Profile loading
- `/apps/frontend/src/app/(app)/profile/[id]/loading.tsx` - Profile detail loading
- `/apps/frontend/src/app/(app)/explore/loading.tsx` - Explore loading
- `/apps/frontend/src/app/(app)/favorites/loading.tsx` - Favorites loading
- `/apps/frontend/src/app/(app)/messages/loading.tsx` - Messages loading
- `/apps/frontend/src/app/(app)/notifications/loading.tsx` - Notifications loading
- `/apps/frontend/src/app/(app)/wallet/loading.tsx` - Wallet loading
- `/apps/frontend/src/app/(app)/nearby/loading.tsx` - Nearby loading
- `/apps/frontend/src/app/(app)/dashboard/@feed/loading.tsx` - Dashboard feed loading
- `/apps/frontend/src/app/(app)/dashboard/@sidebar/loading.tsx` - Dashboard sidebar loading
- `/apps/frontend/src/app/(auth)/loading.tsx` - Auth loading

### Loading Components

**LoadingSpinner Component**

Location: `/apps/frontend/src/components/ui/loading-spinner.tsx`

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

<LoadingSpinner size="lg" text="Loading profile..." />
```

## Error Handling Utilities

**Location:** `/apps/frontend/src/lib/error-handler.ts`

### AppError Class

Custom error class with additional context:

```typescript
export class AppError extends Error {
  type: ErrorType
  statusCode?: number
  isRetryable: boolean
  context?: Record<string, any>
}
```

### Error Classification

Automatically classifies errors by type:

- `NETWORK` - Network connectivity issues
- `AUTHENTICATION` - Auth failures (401, 403)
- `VALIDATION` - Input validation errors (400, 422)
- `NOT_FOUND` - Resource not found (404)
- `SERVER` - Server errors (500+)
- `UNKNOWN` - Unclassified errors

### Retry Logic with Backoff

Automatically retry failed requests:

```typescript
import { retryWithBackoff } from '@/lib/error-handler'

const data = await retryWithBackoff(
  () => fetchData(),
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoff: 'exponential',
  }
)
```

### Global Error Handler

Centralized error handling:

```typescript
import { handleError } from '@/lib/error-handler'

try {
  await someOperation()
} catch (error) {
  handleError(error) // Logs, shows toast, sends to monitoring
}
```

### Network Monitoring

**Location:** `/apps/frontend/src/components/network-monitor.tsx`

Monitors network connectivity and shows notifications when connection is lost or restored.

## Form Validation

**Location:** `/apps/frontend/src/lib/form-validation.ts`

### Form Validation Utilities

```typescript
import { validateForm, FormValidator } from '@/lib/form-validation'

// Validate entire form
const result = validateForm(schema, formData)
if (result.success) {
  // Use result.data
} else {
  // Handle result.errors
}

// Real-time validation
const validator = new FormValidator(schema)
validator.validateField('email', value, allData)
```

### Validation Helpers

Pre-built validators for common patterns:

```typescript
import { validators } from '@/lib/form-validation'

validators.email(value)
validators.phone(value)
validators.passwordStrength(password)
validators.minimumAge(birthDate, 18)
validators.file.maxSize(file, 10)
validators.file.isImage(file)
```

### Input Sanitization

Prevent XSS attacks:

```typescript
import { sanitizeInput } from '@/lib/form-validation'

const clean = sanitizeInput(userInput)
```

## Network Error Handling

### Enhanced API Client

**Location:** `/apps/frontend/src/lib/api.ts`

The API client has been enhanced with:

- **Offline detection** - Checks network status before requests
- **Request timeouts** - 30-second timeout with AbortController
- **Better error messages** - User-friendly error descriptions
- **Empty response handling** - Handles non-JSON responses gracefully
- **Automatic retries** - Can be wrapped with retryWithBackoff

### Example Usage

```typescript
import { userService } from '@/lib/api'
import { retryWithBackoff } from '@/lib/error-handler'

try {
  const profile = await retryWithBackoff(
    () => userService.getProfile(),
    { maxAttempts: 3 }
  )
} catch (error) {
  // Error is automatically classified and has user-friendly message
  console.error(error)
}
```

## Custom Hooks

### useErrorHandler

**Location:** `/apps/frontend/src/hooks/use-error-handler.ts`

Manage error state in components:

```typescript
import { useErrorHandler } from '@/hooks/use-error-handler'

const { error, setError, clearError, handleError } = useErrorHandler()

try {
  await someOperation()
} catch (err) {
  handleError(err) // Automatically classifies and shows toast
}
```

### useAsync

**Location:** `/apps/frontend/src/hooks/use-async.ts`

Handle async operations with loading and error states:

```typescript
import { useAsync } from '@/hooks/use-async'

const { data, loading, error, execute } = useAsync(
  async () => fetchData()
)

// Call execute() when needed
await execute()
```

### useFormValidation

**Location:** `/apps/frontend/src/hooks/use-form-validation.ts`

Real-time form validation:

```typescript
import { useFormValidation } from '@/hooks/use-form-validation'

const { errors, validateAll, validateField, clearError } = useFormValidation(schema)

// Validate entire form
const isValid = validateAll(formData)

// Validate single field (real-time)
validateField('email', value)
```

## UI Components

### ErrorMessage Component

**Location:** `/apps/frontend/src/components/ui/error-message.tsx`

Display error messages with retry/dismiss actions:

```tsx
import { ErrorMessage } from '@/components/ui/error-message'

<ErrorMessage
  title="Failed to load"
  message={error.message}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  variant="card" // or "inline"
/>
```

### LoadingSpinner Component

**Location:** `/apps/frontend/src/components/ui/loading-spinner.tsx`

Consistent loading indicators:

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

<LoadingSpinner size="lg" text="Loading..." />
```

## Best Practices

### 1. Always Wrap Async Operations

```typescript
// Good
try {
  const data = await fetchData()
  setData(data)
} catch (error) {
  handleError(error)
}

// Better - with retry
try {
  const data = await retryWithBackoff(() => fetchData())
  setData(data)
} catch (error) {
  handleError(error)
}
```

### 2. Show Loading States

```tsx
if (loading) {
  return <LoadingSpinner text="Loading..." />
}

if (error) {
  return <ErrorMessage message={error.message} onRetry={retry} />
}

return <YourContent data={data} />
```

### 3. Validate Forms Client-Side

```typescript
const { errors, validateAll } = useFormValidation(schema)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateAll(formData)) {
    return // Show validation errors
  }

  // Submit form
}
```

### 4. Use Error Boundaries for Component Trees

```tsx
<ErrorBoundary>
  <ComplexFeature />
</ErrorBoundary>
```

### 5. Provide Contextual Error Messages

```typescript
// Bad
throw new Error('Error')

// Good
throw new AppError(
  'Failed to load profile. Please try again.',
  ErrorType.SERVER,
  500,
  true
)
```

### 6. Log Errors for Monitoring

All errors are automatically logged to:
- Console (development)
- Error tracking service (production - Sentry, Datadog, etc.)

### 7. Handle Network Offline State

The NetworkMonitor component automatically shows notifications when the user goes offline/online.

### 8. Implement Retry Logic for Transient Failures

```typescript
const data = await retryWithBackoff(
  () => fetchData(),
  {
    maxAttempts: 3,
    retryableErrors: [ErrorType.NETWORK, ErrorType.SERVER]
  }
)
```

## Example Components

Two comprehensive example components demonstrate best practices:

1. **ProfileWithErrorHandling** - `/apps/frontend/src/components/examples/ProfileWithErrorHandling.tsx`
   - Shows proper async handling with useAsync hook
   - Implements retry logic
   - Displays loading and error states

2. **FormWithValidation** - `/apps/frontend/src/components/examples/FormWithValidation.tsx`
   - Real-time form validation
   - Field-level error messages
   - Success/error feedback
   - Loading states during submission

## Server Actions Error Handling

Server actions in `/apps/frontend/src/app/actions.ts` already have comprehensive error handling:

- CSRF protection
- Authentication checks
- Input validation with Zod schemas
- Proper error responses
- File upload validation
- XSS prevention

## Summary

The application now has:

- **13 route-specific error.tsx files** for granular error handling
- **15 loading.tsx files** with skeleton screens
- **Global error boundary** wrapping the entire app
- **Network monitoring** with automatic notifications
- **Comprehensive error utilities** (classification, retry, logging)
- **Form validation utilities** (real-time, sanitization)
- **Enhanced API client** (timeout, offline detection, better errors)
- **Custom hooks** for error and async state management
- **Reusable UI components** for errors and loading
- **Example components** demonstrating best practices

All error handling follows these principles:
1. User-friendly error messages
2. Automatic logging and monitoring
3. Retry logic for transient failures
4. Proper loading states
5. Form validation (client and server)
6. Network status awareness
7. Security (XSS prevention, input sanitization)
