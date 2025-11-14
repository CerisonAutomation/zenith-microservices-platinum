import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-amber-500 mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-amber-200 mb-2">
          Loading Zenith Dating
        </h2>
        <p className="text-amber-400">Preparing your elite experience...</p>
      </div>
    </div>
  )
}
