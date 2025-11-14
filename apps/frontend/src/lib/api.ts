// API Client for Zenith Microservices

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100'
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001'
const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3002'
const DATA_SERVICE_URL = process.env.NEXT_PUBLIC_DATA_SERVICE_URL || 'http://localhost:3003'
const I18N_SERVICE_URL = process.env.NEXT_PUBLIC_I18N_SERVICE_URL || 'http://localhost:3004'

// API Client class with authentication and error handling
class APIClient {
  private baseUrl: string
  // SECURITY FIX #1: Removed token storage - using httpOnly cookies instead
  // Tokens are now managed by Supabase in secure httpOnly cookies
  // This prevents XSS attacks from accessing authentication tokens

  constructor(baseUrl: string = API_GATEWAY_URL) {
    this.baseUrl = baseUrl
    // SECURITY: No longer reading tokens from localStorage (XSS vulnerability)
  }

  // SECURITY FIX #1: Token management methods kept for backward compatibility
  // but now they're no-ops. Tokens are managed via httpOnly cookies by Supabase.
  setToken(token: string) {
    // No-op: Tokens are now in httpOnly cookies set by the server
    // This method is kept for API compatibility but does nothing
    console.warn('Token management is now handled via httpOnly cookies')
  }

  clearToken() {
    // No-op: Tokens are now in httpOnly cookies cleared by the server
    // This method is kept for API compatibility but does nothing
    console.warn('Token clearing is now handled via httpOnly cookies')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check network connectivity first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new APIError(
        'No internet connection. Please check your network.',
        0,
        { offline: true }
      )
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // SECURITY FIX #1: No manual Authorization header needed
    // Authentication is handled via httpOnly cookies sent automatically
    // The browser will include credentials (cookies) with each request

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // SECURITY: Always include cookies for auth
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let error: any = {}
        try {
          error = await response.json()
        } catch {
          error = { message: response.statusText }
        }

        throw new APIError(
          error.message || error.error || 'Request failed',
          response.status,
          error
        )
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return {} as T
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error
      }

      // Handle fetch abort
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408, { timeout: true })
      }

      // Handle network errors
      if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
        throw new APIError('Network error. Please check your connection.', 0, {
          network: true,
        })
      }

      throw new APIError('An unexpected error occurred', 500, error)
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Custom error class for API errors
export class APIError extends Error {
  status: number
  data: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

// Create API client instances
export const api = new APIClient(API_GATEWAY_URL)
export const authAPI = new APIClient(AUTH_SERVICE_URL)
export const paymentAPI = new APIClient(PAYMENT_SERVICE_URL)
export const dataAPI = new APIClient(DATA_SERVICE_URL)
export const i18nAPI = new APIClient(I18N_SERVICE_URL)

// Authentication API
export const authService = {
  async login(email: string, password: string) {
    return authAPI.post('/auth/login', { email, password })
  },

  async signup(data: { email: string; password: string; name: string }) {
    return authAPI.post('/auth/signup', data)
  },

  async logout() {
    const result = await authAPI.post('/auth/logout')
    authAPI.clearToken()
    return result
  },

  async refreshToken() {
    return authAPI.post('/auth/refresh')
  },

  async forgotPassword(email: string) {
    return authAPI.post('/auth/forgot-password', { email })
  },

  async resetPassword(token: string, password: string) {
    return authAPI.post('/auth/reset-password', { token, password })
  },

  async verifyEmail(token: string) {
    return authAPI.post('/auth/verify-email', { token })
  },

  async enable2FA() {
    return authAPI.post('/auth/2fa/enable')
  },

  async verify2FA(code: string) {
    return authAPI.post('/auth/2fa/verify', { code })
  },

  async oauthLogin(provider: 'google' | 'github' | 'facebook') {
    return authAPI.get(`/auth/oauth/${provider}`)
  },
}

// User/Profile API
export const userService = {
  async getProfile(userId?: string) {
    return dataAPI.get(userId ? `/users/${userId}` : '/users/me')
  },

  async updateProfile(data: any) {
    return dataAPI.put('/users/me', data)
  },

  async uploadPhoto(file: File) {
    const formData = new FormData()
    formData.append('photo', file)

    // SECURITY FIX #1: Removed direct token access - use httpOnly cookies
    return fetch(`${DATA_SERVICE_URL}/users/me/photos`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // SECURITY: Include httpOnly cookies for auth
      // No Authorization header needed - handled via cookies
    }).then((res) => res.json())
  },

  async deletePhoto(photoId: string) {
    return dataAPI.delete(`/users/me/photos/${photoId}`)
  },

  async updateLocation(latitude: number, longitude: number) {
    return dataAPI.post('/users/me/location', { latitude, longitude })
  },

  async getSettings() {
    return dataAPI.get('/users/me/settings')
  },

  async updateSettings(settings: any) {
    return dataAPI.put('/users/me/settings', settings)
  },
}

// Discovery/Matching API
export const discoveryService = {
  async getProfiles(filters?: {
    minAge?: number
    maxAge?: number
    gender?: string
    maxDistance?: number
    interests?: string[]
  }) {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    return api.get(`/discovery/profiles?${params.toString()}`)
  },

  async likeProfile(profileId: string) {
    return api.post(`/discovery/like/${profileId}`)
  },

  async passProfile(profileId: string) {
    return api.post(`/discovery/pass/${profileId}`)
  },

  async superLike(profileId: string) {
    return api.post(`/discovery/super-like/${profileId}`)
  },

  async getMatches() {
    return api.get('/discovery/matches')
  },

  async unmatch(matchId: string) {
    return api.delete(`/discovery/matches/${matchId}`)
  },
}

// Messaging API
export const messagingService = {
  async getConversations() {
    return api.get('/messaging/conversations')
  },

  async getMessages(conversationId: string) {
    return api.get(`/messaging/conversations/${conversationId}/messages`)
  },

  async sendMessage(conversationId: string, content: string) {
    return api.post(`/messaging/conversations/${conversationId}/messages`, {
      content,
    })
  },

  async markAsRead(conversationId: string, messageId: string) {
    return api.post(
      `/messaging/conversations/${conversationId}/messages/${messageId}/read`
    )
  },

  async deleteConversation(conversationId: string) {
    return api.delete(`/messaging/conversations/${conversationId}`)
  },

  async reportUser(userId: string, reason: string) {
    return api.post('/messaging/report', { userId, reason })
  },

  async blockUser(userId: string) {
    return api.post('/messaging/block', { userId })
  },
}

// Favorites API
export const favoritesService = {
  async getFavorites() {
    return api.get('/favorites')
  },

  async addFavorite(profileId: string) {
    return api.post(`/favorites/${profileId}`)
  },

  async removeFavorite(profileId: string) {
    return api.delete(`/favorites/${profileId}`)
  },
}

// Booking API
export const bookingService = {
  async getBookings() {
    return api.get('/bookings')
  },

  async createBooking(data: {
    userId: string
    date: string
    location: string
    type: string
  }) {
    return api.post('/bookings', data)
  },

  async updateBooking(bookingId: string, data: any) {
    return api.put(`/bookings/${bookingId}`, data)
  },

  async cancelBooking(bookingId: string) {
    return api.delete(`/bookings/${bookingId}`)
  },

  async confirmBooking(bookingId: string) {
    return api.post(`/bookings/${bookingId}/confirm`)
  },
}

// Payment/Subscription API
export const paymentService = {
  async createCheckoutSession(priceId: string) {
    return paymentAPI.post('/payments/create-checkout-session', { priceId })
  },

  async getSubscription() {
    return paymentAPI.get('/payments/subscription')
  },

  async cancelSubscription() {
    return paymentAPI.post('/payments/subscription/cancel')
  },

  async updatePaymentMethod(paymentMethodId: string) {
    return paymentAPI.put('/payments/payment-method', { paymentMethodId })
  },

  async getInvoices() {
    return paymentAPI.get('/payments/invoices')
  },

  async purchaseBoosts(quantity: number) {
    return paymentAPI.post('/payments/purchase-boosts', { quantity })
  },

  async getWallet() {
    return paymentAPI.get('/payments/wallet')
  },

  async addFunds(amount: number) {
    return paymentAPI.post('/payments/wallet/add-funds', { amount })
  },
}

// Notification API
export const notificationService = {
  async getNotifications() {
    return api.get('/notifications')
  },

  async markAsRead(notificationId: string) {
    return api.post(`/notifications/${notificationId}/read`)
  },

  async markAllAsRead() {
    return api.post('/notifications/read-all')
  },

  async deleteNotification(notificationId: string) {
    return api.delete(`/notifications/${notificationId}`)
  },

  async getSettings() {
    return api.get('/notifications/settings')
  },

  async updateSettings(settings: any) {
    return api.put('/notifications/settings', settings)
  },
}

// Video call API
export const videoService = {
  async createRoom(userId: string) {
    return api.post('/video/rooms', { userId })
  },

  async joinRoom(roomId: string) {
    return api.post(`/video/rooms/${roomId}/join`)
  },

  async leaveRoom(roomId: string) {
    return api.post(`/video/rooms/${roomId}/leave`)
  },

  async endCall(roomId: string) {
    return api.delete(`/video/rooms/${roomId}`)
  },
}

// Safety/Verification API
export const safetyService = {
  async reportUser(userId: string, reason: string, details: string) {
    return api.post('/safety/report', { userId, reason, details })
  },

  async requestVerification(type: 'photo' | 'id' | 'phone') {
    return api.post('/safety/verification', { type })
  },

  async submitVerificationPhoto(file: File) {
    const formData = new FormData()
    formData.append('photo', file)

    // SECURITY FIX #1: Removed direct token access - use httpOnly cookies
    return fetch(`${API_GATEWAY_URL}/safety/verification/photo`, {
      method: 'POST',
      body: formData,
      credentials: 'include', // SECURITY: Include httpOnly cookies for auth
      // No Authorization header needed - handled via cookies
    }).then((res) => res.json())
  },

  async getBlockedUsers() {
    return api.get('/safety/blocked')
  },

  async blockUser(userId: string) {
    return api.post('/safety/block', { userId })
  },

  async unblockUser(userId: string) {
    return api.delete(`/safety/blocked/${userId}`)
  },
}

// i18n API
export const i18nService = {
  async getTranslations(locale: string) {
    return i18nAPI.get(`/translations/${locale}`)
  },

  async getSupportedLocales() {
    return i18nAPI.get('/translations/locales')
  },

  async translateText(text: string, targetLocale: string) {
    return i18nAPI.post('/translations/translate', { text, targetLocale })
  },
}

// AI Matching API
export const aiService = {
  async getMatchScore(userId: string) {
    return api.get(`/ai/match-score/${userId}`)
  },

  async getRecommendations() {
    return api.get('/ai/recommendations')
  },

  async trainModel(feedback: any) {
    return api.post('/ai/train', feedback)
  },
}

export default api
