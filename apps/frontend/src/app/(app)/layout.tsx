/**
 * 🎯 MAIN APP LAYOUT (Route Group)
 * Layout for authenticated app pages
 * Includes bottom navigation and supports parallel routes
 */

import { ReactNode } from 'react'
import BottomNav from '@/components/navigation/BottomNav'
import { Toaster } from '@/components/ui/toaster'

export default function AppLayout({
  children,
  modal,
  notifications,
}: {
  children: ReactNode
  modal?: ReactNode  // Parallel route for intercepted modals
  notifications?: ReactNode  // Parallel route for notification panel
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Intercepted route modals (profile, booking, photos) */}
      {modal}

      {/* Parallel route for notifications sidebar */}
      {notifications}

      <BottomNav activeTab="explore" onTabChange={() => {}} />
      <Toaster />
    </div>
  )
}
