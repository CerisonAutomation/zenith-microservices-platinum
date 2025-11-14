import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-amber-200">Loading wallet...</p>
      </div>
    </div>
  )
}
