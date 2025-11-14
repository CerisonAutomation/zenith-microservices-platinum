/**
 * 🏠 Home Page - Landing/Dashboard
 * Next.js 14 App Router page
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Authenticated users go to explore
        router.replace('/explore')
      } else {
        // Non-authenticated users go to landing
        router.replace('/')
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-amber-200">Loading...</p>
      </div>
    </div>
  )
}
