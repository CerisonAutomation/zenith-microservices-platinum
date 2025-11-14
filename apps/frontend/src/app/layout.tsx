/**
 * 🚀 ZENITH DATING - ELITE LAYOUT COMPONENT
 * Senior-level Next.js 14 App Router layout with dark amber/gold theme
 * Complete authentication, state management, and premium UI integration
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { AppProvider } from '../contexts/AppContext'
import { LocationProvider } from '../contexts/LocationContext'
import { Toaster } from '../components/ui/toaster'
import BottomNav from '../components/navigation/BottomNav'
import { ErrorBoundary } from '../components/error-boundary'
import { Suspense } from 'react'
import { NetworkMonitor } from '../components/network-monitor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zenith Dating - Elite Connections',
  description: 'Find your perfect match with our premium dating platform featuring real-time chat, advanced filtering, and elite user experience.',
  keywords: 'dating, relationships, matchmaking, premium dating, elite singles',
  authors: [{ name: 'Zenith Dating' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Zenith Dating - Elite Connections',
    description: 'Find your perfect match with our premium dating platform',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zenith Dating - Elite Connections',
    description: 'Find your perfect match with our premium dating platform',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-amber-50 min-h-screen`}>
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-gray-900 focus:rounded-md focus:font-semibold"
        >
          Skip to main content
        </a>

        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900" role="status" aria-live="polite">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
                <h2 className="text-xl font-semibold text-amber-200">Loading Zenith Dating</h2>
                <p className="text-amber-400 mt-2">Preparing your elite experience...</p>
                <span className="sr-only">Loading application, please wait</span>
              </div>
            </div>
          }>
            <AuthProvider>
              <AppProvider>
                <LocationProvider>
                  <NetworkMonitor />
                  <div className="flex flex-col min-h-screen">
                    <main id="main-content" className="flex-1 pb-20">
                      {children}
                    </main>
                    <BottomNav activeTab="explore" onTabChange={() => {}} />
                  </div>
                  <Toaster />
                </LocationProvider>
              </AppProvider>
            </AuthProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  )
}