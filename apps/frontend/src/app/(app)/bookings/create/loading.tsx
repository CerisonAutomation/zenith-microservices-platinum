import { Loader2, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function CreateBookingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-amber-500" />
          <Skeleton className="h-8 w-48 bg-amber-900/20" />
        </div>

        {/* Form skeleton */}
        <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
          {/* Profile selection */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 bg-amber-900/20" />
            <Skeleton className="h-12 w-full bg-amber-900/20 rounded" />
          </div>

          {/* Date and time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24 bg-amber-900/20" />
              <Skeleton className="h-12 w-full bg-amber-900/20 rounded" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-24 bg-amber-900/20" />
              <Skeleton className="h-12 w-full bg-amber-900/20 rounded" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-28 bg-amber-900/20" />
            <Skeleton className="h-12 w-full bg-amber-900/20 rounded" />
          </div>

          {/* Meeting type */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 bg-amber-900/20" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full bg-amber-900/20 rounded" />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-20 bg-amber-900/20" />
            <Skeleton className="h-32 w-full bg-amber-900/20 rounded" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 flex-1 bg-amber-900/20 rounded" />
            <Skeleton className="h-12 flex-1 bg-amber-900/20 rounded" />
          </div>
        </div>

        {/* Loading indicator */}
        <div className="fixed top-20 right-6">
          <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <p className="text-amber-200 text-sm">Loading form...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
