import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-10 w-48 bg-amber-900/20 mb-4" />
          <Skeleton className="h-5 w-96 bg-amber-900/20" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-6 space-y-3">
              <Skeleton className="h-6 w-24 bg-amber-900/20" />
              <Skeleton className="h-8 w-16 bg-amber-900/20" />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-6 space-y-4">
              <Skeleton className="h-6 w-32 bg-amber-900/20" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-16 w-full bg-amber-900/20" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="fixed top-20 right-6">
          <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <p className="text-amber-200 text-sm">Loading home...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
