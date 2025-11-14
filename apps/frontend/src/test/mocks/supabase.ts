import { vi } from 'vitest'

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
        },
      },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
        },
      },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({
      error: null,
    }),
    signInWithOAuth: vi.fn().mockResolvedValue({
      data: { url: 'https://oauth-url.com' },
      error: null,
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({
      data: {},
      error: null,
    }),
    updateUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    }),
    onAuthStateChange: vi.fn().mockImplementation((callback) => {
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }
    }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: {
      id: 'test-id',
      name: 'Test User',
    },
    error: null,
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      }),
      remove: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    }),
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue({
      unsubscribe: vi.fn(),
    }),
  }),
}

// Mock createClient function
export const createMockClient = vi.fn(() => mockSupabaseClient)

// Mock Supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: createMockClient,
}))

// Mock SSR client
vi.mock('@/utils/supabase/client', () => ({
  createClient: createMockClient,
  isSupabaseConfigured: vi.fn(() => true),
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: createMockClient,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
  isSupabaseConfigured: vi.fn(() => true),
  uploadFile: vi.fn().mockResolvedValue({ path: 'test-path' }),
  getPublicUrl: vi.fn(() => 'https://example.com/test.jpg'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  subscribeToChannel: vi.fn().mockReturnValue({
    unsubscribe: vi.fn(),
  }),
  subscribeToMessages: vi.fn().mockReturnValue({
    unsubscribe: vi.fn(),
  }),
  subscribeToNotifications: vi.fn().mockReturnValue({
    unsubscribe: vi.fn(),
  }),
  getUser: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    name: 'Test User',
  }),
  getProfiles: vi.fn().mockResolvedValue([
    {
      id: 'profile-1',
      name: 'Test Profile 1',
      age: 25,
    },
  ]),
  getMatches: vi.fn().mockResolvedValue([]),
  getFavorites: vi.fn().mockResolvedValue([]),
  getConversations: vi.fn().mockResolvedValue([]),
  getMessages: vi.fn().mockResolvedValue([]),
  sendMessage: vi.fn().mockResolvedValue({
    id: 'message-1',
    content: 'Test message',
  }),
}))

export default mockSupabaseClient
