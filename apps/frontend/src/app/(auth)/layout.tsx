/**
 * 🔐 AUTH LAYOUT (Route Group)
 * Layout for authentication pages (login, signup, reset password)
 * No bottom nav, full-screen auth forms
 */

import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        {children}
      </div>
    </div>
  )
}
