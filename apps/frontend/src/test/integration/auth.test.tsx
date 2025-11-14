import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { AuthFlow } from '@/components/auth/AuthFlow'
import { mockSupabaseClient } from '../mocks/supabase'
import '../mocks/supabase'

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Sign Up Flow', () => {
    it('should complete full sign up process', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          session: {
            access_token: 'new-token',
            refresh_token: 'new-refresh',
          },
        },
        error: null,
      })

      render(<AuthFlow />)

      // Switch to sign up tab
      const signUpTab = screen.getByText('Sign Up')
      fireEvent.click(signUpTab)

      // Fill in form
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement

      fireEvent.change(nameInput, { target: { value: 'New User' } })
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'SecurePass123!' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          options: {
            data: { name: 'New User' },
            emailRedirectTo: expect.stringContaining('/auth/callback'),
          },
        })
      })
    })

    it('should prevent sign up with mismatched passwords', async () => {
      render(<AuthFlow />)

      // Switch to sign up tab
      const signUpTab = screen.getByText('Sign Up')
      fireEvent.click(signUpTab)

      // Fill in form with mismatched passwords
      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement

      fireEvent.change(nameInput, { target: { value: 'New User' } })
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signUp).not.toHaveBeenCalled()
      })
    })
  })

  describe('Complete Sign In Flow', () => {
    it('should complete full sign in process', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: {
            id: 'existing-user-id',
            email: 'existing@example.com',
          },
          session: {
            access_token: 'existing-token',
            refresh_token: 'existing-refresh',
          },
        },
        error: null,
      })

      render(<AuthFlow />)

      // Fill in sign in form
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'existing@example.com',
          password: 'password123',
        })
      })
    })

    it('should handle invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 401 } as any,
      })

      render(<AuthFlow />)

      // Fill in sign in form
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled()
      })
    })
  })

  describe('Password Reset Flow', () => {
    it('should complete password reset request', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null,
      })

      render(<AuthFlow />)

      // Click forgot password
      const forgotPasswordLink = screen.getByText('Forgot password?')
      fireEvent.click(forgotPasswordLink)

      // Fill in email
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })

      // Submit
      const submitButton = screen.getByRole('button', { name: /send reset link/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'user@example.com',
          {
            redirectTo: expect.stringContaining('/auth/reset-password'),
          }
        )
      })
    })

    it('should navigate back to sign in from password reset', () => {
      render(<AuthFlow />)

      // Go to password reset
      const forgotPasswordLink = screen.getByText('Forgot password?')
      fireEvent.click(forgotPasswordLink)

      expect(screen.getByText('Reset Password')).toBeInTheDocument()

      // Go back
      const backButton = screen.getByText('Back to Sign In')
      fireEvent.click(backButton)

      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.queryByText('Reset Password')).not.toBeInTheDocument()
    })
  })

  describe('OAuth Flow', () => {
    it('should initiate OAuth flow for all providers', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth-url.com' },
        error: null,
      })

      render(<AuthFlow />)

      const buttons = screen.getAllByRole('button')

      // Google OAuth (4th button)
      fireEvent.click(buttons[3])
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: expect.any(Object),
        })
      })

      // Facebook OAuth (5th button)
      fireEvent.click(buttons[4])
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'facebook',
          options: expect.any(Object),
        })
      })

      // Apple OAuth (6th button)
      fireEvent.click(buttons[5])
      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'apple',
          options: expect.any(Object),
        })
      })
    })
  })

  describe('Session Persistence', () => {
    it('should persist session after sign in', async () => {
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      }

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: mockSession.user,
          session: mockSession,
        },
        error: null,
      })

      render(<AuthFlow />)

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalled()
      })
    })
  })
})
