import { AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: 'inline' | 'card'
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  className,
  variant = 'inline',
}: ErrorMessageProps) {
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'bg-red-950/30 border border-red-500/30 rounded-lg p-6 text-center',
          className
        )}
      >
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-300 mb-2">{title}</h3>
        <p className="text-red-200 mb-4">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
            >
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} variant="ghost">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <div className="flex gap-2 ml-4">
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="h-8"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
