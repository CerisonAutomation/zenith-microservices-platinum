import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { AuthFlow } from './AuthFlow'
import '../../test/mocks/supabase'

// Mock the AuthContext
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockResetPassword = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithOAuth: mockSignInWithOAuth,
    resetPassword: mockResetPassword,
  }),
}))

describe('AuthFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Sign In Tab', () => {
    it('should render sign in form', () => {
      render(<AuthFlow />)

      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('should handle sign in submission', async () => {
      mockSignIn.mockResolvedValue(undefined)
      render(<AuthFlow />)

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('should show loading state during sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
      render(<AuthFlow />)

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      expect(screen.getByText('Signing In...')).toBeInTheDocument()
    })

    it('should switch to forgot password view', () => {
      render(<AuthFlow />)

      const forgotPasswordLink = screen.getByText('Forgot password?')
      fireEvent.click(forgotPasswordLink)

      expect(screen.getByText('Reset Password')).toBeInTheDocument()
    })
  })

  describe('Sign Up Tab', () => {
    it('should render sign up form', () => {
      render(<AuthFlow />)

      const signUpTab = screen.getByText('Sign Up')
      fireEvent.click(signUpTab)

      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })

    it('should handle sign up submission', async () => {
      mockSignUp.mockResolvedValue(undefined)
      render(<AuthFlow />)

      const signUpTab = screen.getByText('Sign Up')
      fireEvent.click(signUpTab)

      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', {
          name: 'Test User',
        })
      })
    })

    it('should show error when passwords do not match', async () => {
      render(<AuthFlow />)

      const signUpTab = screen.getByText('Sign Up')
      fireEvent.click(signUpTab)

      const nameInput = screen.getByLabelText('Name') as HTMLInputElement
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
      const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /create account/i })

      fireEvent.change(nameInput, { target: { value: 'Test User' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignUp).not.toHaveBeenCalled()
      })
    })
  })

  describe('OAuth Sign In', () => {
    it('should handle Google OAuth sign in', async () => {
      mockSignInWithOAuth.mockResolvedValue(undefined)
      render(<AuthFlow />)

      const googleButton = screen.getAllByRole('button')[3] // Google is the 4th button
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith('google')
      })
    })

    it('should handle Facebook OAuth sign in', async () => {
      mockSignInWithOAuth.mockResolvedValue(undefined)
      render(<AuthFlow />)

      const facebookButton = screen.getAllByRole('button')[4] // Facebook is the 5th button
      fireEvent.click(facebookButton)

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith('facebook')
      })
    })

    it('should handle Apple OAuth sign in', async () => {
      mockSignInWithOAuth.mockResolvedValue(undefined)
      render(<AuthFlow />)

      const appleButton = screen.getAllByRole('button')[5] // Apple is the 6th button
      fireEvent.click(appleButton)

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith('apple')
      })
    })
  })

  describe('Reset Password', () => {
    it('should render reset password form', () => {
      render(<AuthFlow />)

      const forgotPasswordLink = screen.getByText('Forgot password?')
      fireEvent.click(forgotPasswordLink)

      expect(screen.getByText('Reset Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('should handle reset password submission', async () => {
      mockResetPassword.mockResolvedValue(undefined)
      render(<AuthFlow />)

      const forgotPasswordLink = screen.getByText('Forgot password?')
      fireEvent.click(forgotPasswordLink)

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /send reset link/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
      })
    })

    it('should go back to sign in from reset password', () => {
      render(<AuthFlow />)

      const forgotPasswordLink = screen.getByText('Forgot password?')
      fireEvent.click(forgotPasswordLink)

      const backButton = screen.getByText('Back to Sign In')
      fireEvent.click(backButton)

      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.queryByText('Reset Password')).not.toBeInTheDocument()
    })
  })
})
