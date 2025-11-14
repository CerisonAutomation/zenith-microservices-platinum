import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-6">
            <Skeleton className="h-8 w-64 bg-amber-900/20 mb-2" />
            <Skeleton className="h-4 w-96 bg-amber-900/20" />
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                <Skeleton className="h-48 w-full bg-amber-900/20 rounded" />
                <Skeleton className="h-4 w-3/4 bg-amber-900/20" />
                <Skeleton className="h-4 w-1/2 bg-amber-900/20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2">
        <div className="bg-gray-800/90 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-3 border border-amber-500/30">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <p className="text-amber-200 text-sm">Loading...</p>
        </div>
      </div>
    </div>
  )
}
