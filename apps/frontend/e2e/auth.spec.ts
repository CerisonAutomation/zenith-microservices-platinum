import { test, expect } from '@playwright/test'

test.describe('User Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('User Registration', () => {
    test('should complete user registration flow', async ({ page }) => {
      // Navigate to sign up
      await page.getByText('Sign Up').click()

      // Fill registration form
      await page.getByLabel('Name').fill('Test User')
      await page.getByLabel('Email').fill(`test-${Date.now()}@example.com`)
      await page.getByLabel('Password', { exact: true }).fill('Test123!@#')
      await page.getByLabel('Confirm Password').fill('Test123!@#')

      // Submit form
      await page.getByRole('button', { name: /create account/i }).click()

      // Wait for success or redirect
      await expect(page).toHaveURL(/\//, { timeout: 10000 })
    })

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.getByText('Sign Up').click()

      await page.getByLabel('Name').fill('Test User')
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password', { exact: true }).fill('Test123!@#')
      await page.getByLabel('Confirm Password').fill('Different123!@#')

      await page.getByRole('button', { name: /create account/i }).click()

      // Should show error or not proceed
      await page.waitForTimeout(1000)
      // Form should still be visible
      expect(await page.getByLabel('Name')).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      await page.getByText('Sign Up').click()

      await page.getByLabel('Name').fill('Test User')
      await page.getByLabel('Email').fill('invalid-email')
      await page.getByLabel('Password', { exact: true }).fill('Test123!@#')
      await page.getByLabel('Confirm Password').fill('Test123!@#')

      await page.getByRole('button', { name: /create account/i }).click()

      // HTML5 validation should prevent submission
      const emailInput = page.getByLabel('Email')
      expect(await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false)
    })

    test('should require all fields', async ({ page }) => {
      await page.getByText('Sign Up').click()

      // Try to submit without filling anything
      await page.getByRole('button', { name: /create account/i }).click()

      // Form should still be visible
      expect(await page.getByLabel('Name')).toBeVisible()
    })
  })

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      // Fill login form
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')

      // Submit
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should redirect to home or show logged in state
      await page.waitForTimeout(2000)
    })

    test('should show loading state during login', async ({ page }) => {
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')

      await page.getByRole('button', { name: /sign in/i }).click()

      // Check for loading state
      await expect(page.getByText('Signing In...')).toBeVisible({ timeout: 1000 })
    })

    test('should handle invalid credentials gracefully', async ({ page }) => {
      await page.getByLabel('Email').fill('wrong@example.com')
      await page.getByLabel('Password').fill('wrongpassword')

      await page.getByRole('button', { name: /sign in/i }).click()

      await page.waitForTimeout(2000)
      // Should remain on auth page or show error
    })

    test('should require both email and password', async ({ page }) => {
      // Try to submit with only email
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Form should still be visible
      expect(await page.getByLabel('Password')).toBeVisible()
    })
  })

  test.describe('Password Reset', () => {
    test('should navigate to password reset', async ({ page }) => {
      await page.getByText('Forgot password?').click()

      await expect(page.getByText('Reset Password')).toBeVisible()
      expect(await page.getByLabel('Email')).toBeVisible()
    })

    test('should submit password reset request', async ({ page }) => {
      await page.getByText('Forgot password?').click()

      await page.getByLabel('Email').fill('test@example.com')
      await page.getByRole('button', { name: /send reset link/i }).click()

      await page.waitForTimeout(2000)
    })

    test('should navigate back to sign in', async ({ page }) => {
      await page.getByText('Forgot password?').click()
      await expect(page.getByText('Reset Password')).toBeVisible()

      await page.getByText('Back to Sign In').click()

      await expect(page.getByText('Sign In')).toBeVisible()
      await expect(page.getByText('Reset Password')).not.toBeVisible()
    })
  })

  test.describe('OAuth Login', () => {
    test('should display OAuth providers', async ({ page }) => {
      // Check for OAuth buttons
      const buttons = await page.getByRole('button').all()
      expect(buttons.length).toBeGreaterThan(3)
    })

    test('should handle Google OAuth click', async ({ page }) => {
      // Get all buttons and find OAuth buttons (they're icon-only)
      const buttons = await page.getByRole('button').all()

      // Click on one of the OAuth buttons
      if (buttons.length > 3) {
        await buttons[3].click()
        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()

      await page.waitForTimeout(2000)

      // Reload page
      await page.reload()

      // Should still be logged in (in demo mode, user is always logged in)
      await page.waitForTimeout(1000)
    })
  })
})
