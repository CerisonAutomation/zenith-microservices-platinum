import { Loader2 } from 'lucide-react'

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
        <p className="text-purple-200 text-lg">Authenticating...</p>
      </div>
    </div>
  )
}
