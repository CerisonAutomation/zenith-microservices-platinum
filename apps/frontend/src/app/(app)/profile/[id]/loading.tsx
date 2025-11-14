import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile photo */}
            <Skeleton className="h-32 w-32 rounded-full bg-amber-900/20" />

            {/* Profile info */}
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48 bg-amber-900/20" />
              <Skeleton className="h-5 w-32 bg-amber-900/20" />
              <Skeleton className="h-4 w-full bg-amber-900/20" />
              <Skeleton className="h-4 w-3/4 bg-amber-900/20" />

              {/* Tags */}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-20 bg-amber-900/20 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Photos grid */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <Skeleton className="h-6 w-32 bg-amber-900/20 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full bg-amber-900/20 rounded" />
            ))}
          </div>
        </div>

        {/* About section */}
        <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-32 bg-amber-900/20" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full bg-amber-900/20" />
            <Skeleton className="h-4 w-full bg-amber-900/20" />
            <Skeleton className="h-4 w-3/4 bg-amber-900/20" />
          </div>
        </div>

        {/* Loading indicator */}
        <div className="fixed top-20 right-6">
          <div className="bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <p className="text-amber-200 text-sm">Loading profile...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
