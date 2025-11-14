import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'

interface AllTheProvidersProps {
  children: ReactNode
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data helpers
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    isPremium: false,
  },
  aud: 'authenticated',
  role: 'authenticated',
  ...overrides,
})

export const createMockSession = (overrides = {}) => ({
  access_token: 'test-token',
  refresh_token: 'test-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides,
})

export const createMockProfile = (overrides = {}) => ({
  id: 'profile-1',
  name: 'Test Profile',
  age: 25,
  distance: '5 km',
  online: true,
  photo: 'https://example.com/photo.jpg',
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  bio: 'Test bio',
  verified: true,
  meetNow: false,
  videoVerified: true,
  responseRate: 95,
  lastActive: '2h ago',
  kinks: ['Test kink 1', 'Test kink 2'],
  roles: ['Test role 1'],
  bookingPreferences: {
    preferredMeetingTypes: ['coffee'],
    availability: ['weekends'],
    budgetRange: [50, 200] as [number, number],
    communicationStyle: ['direct'],
    safetyPreferences: ['public_first'],
    specialRequests: [],
  },
  ...overrides,
})

// Wait for async updates
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0))

// Async test helper
export const waitFor = (callback: () => void, options = {}) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      callback()
      resolve(true)
    }, 100)
  })
}
