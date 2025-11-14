import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={cn('animate-spin text-amber-500', sizeClasses[size], className)}
        aria-hidden="true"
      />
      {text && (
        <p className="text-sm text-amber-200">
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
