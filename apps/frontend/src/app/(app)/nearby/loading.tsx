import { Loader2, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function NearbyLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-6 h-6 text-amber-500" />
          <Skeleton className="h-8 w-48 bg-amber-900/20" />
        </div>

        {/* Map skeleton */}
        <div className="mb-6">
          <Skeleton className="h-64 w-full bg-amber-900/20 rounded-lg" />
        </div>

        {/* Profiles skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full bg-amber-900/20" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 bg-amber-900/20" />
                  <Skeleton className="h-3 w-24 bg-amber-900/20" />
                </div>
              </div>
              <Skeleton className="h-32 w-full bg-amber-900/20 rounded" />
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="fixed top-20 right-6">
          <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <p className="text-amber-200 text-sm">Finding nearby...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
