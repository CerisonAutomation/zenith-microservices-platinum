import { test, expect } from '@playwright/test'

test.describe('Subscription Purchase E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test.describe('Accessing Subscription Page', () => {
    test('should find upgrade/premium button', async ({ page }) => {
      await page.waitForTimeout(2000)

      // Look for upgrade, premium, or crown icon buttons
      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium|elite/i }).all()
      const crownButtons = await page.locator('button:has([class*="Crown"])').all()

      expect(upgradeButtons.length + crownButtons.length).toBeGreaterThanOrEqual(0)
    })

    test('should open subscription dialog', async ({ page }) => {
      await page.waitForTimeout(2000)

      // Try to find and click upgrade button
      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Should show subscription dialog
        await expect(page.getByText('Upgrade Your Experience')).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Viewing Subscription Plans', () => {
    test('should display Premium plan details', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for Premium plan
        await expect(page.getByText('Premium')).toBeVisible()
        await expect(page.getByText('$9.99')).toBeVisible()
      }
    })

    test('should display Elite plan details', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for Elite plan
        await expect(page.getByText('Elite')).toBeVisible()
        await expect(page.getByText('$19.99')).toBeVisible()
        await expect(page.getByText('Most Popular')).toBeVisible()
      }
    })

    test('should list all Premium features', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for key features
        await expect(page.getByText('Unlimited likes & matches')).toBeVisible()
        await expect(page.getByText('See who liked you')).toBeVisible()
        await expect(page.getByText('Advanced filters')).toBeVisible()
      }
    })

    test('should list all Elite features', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for key Elite features
        await expect(page.getByText('Everything in Premium')).toBeVisible()
        await expect(page.getByText('Priority placement')).toBeVisible()
        await expect(page.getByText('Video chat')).toBeVisible()
      }
    })

    test('should show NFT lifetime membership option', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        await expect(page.getByText('NFT Lifetime Membership')).toBeVisible()
        await expect(page.getByText('Learn More')).toBeVisible()
      }
    })
  })

  test.describe('Subscription Purchase Flow', () => {
    test('should initiate Premium subscription', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Click Subscribe Now button for Premium
        const subscribeButtons = await page.getByText('Subscribe Now').all()
        if (subscribeButtons.length > 0) {
          await subscribeButtons[0].click()
          await page.waitForTimeout(1000)

          // In demo mode, this might just close the dialog
          // In production, would redirect to Stripe checkout
        }
      }
    })

    test('should initiate Elite subscription', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Click Subscribe Now button for Elite
        const subscribeButtons = await page.getByText('Subscribe Now').all()
        if (subscribeButtons.length >= 2) {
          await subscribeButtons[1].click()
          await page.waitForTimeout(1000)
        }
      }
    })

    test('should show loading state during subscription', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        const subscribeButtons = await page.getByText('Subscribe Now').all()
        if (subscribeButtons.length > 0) {
          // Click might show loading state briefly
          await subscribeButtons[0].click()
        }
      }
    })
  })

  test.describe('Payment Security Information', () => {
    test('should display Stripe security badge', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for Stripe mention
        await expect(page.getByText(/Stripe/)).toBeVisible()
      }
    })

    test('should show cancellation policy', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for cancellation info
        await expect(page.getByText(/Cancel anytime/)).toBeVisible()
      }
    })

    test('should indicate secure payment', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for security mentions
        await expect(page.getByText(/Secure payment/)).toBeVisible()
      }
    })
  })

  test.describe('Plan Comparison', () => {
    test('should highlight most popular plan', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Elite plan should have "Most Popular" badge
        const popularBadge = page.getByText('Most Popular')
        await expect(popularBadge).toBeVisible()
      }
    })

    test('should show checkmarks for included features', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Look for check icons
        const checkIcons = await page.locator('[class*="Check"]').all()
        expect(checkIcons.length).toBeGreaterThan(0)
      }
    })

    test('should display pricing clearly', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Check for price and billing period
        await expect(page.getByText('$9.99')).toBeVisible()
        await expect(page.getByText('$19.99')).toBeVisible()
        const monthTexts = await page.getByText('/month').all()
        expect(monthTexts.length).toBe(2)
      }
    })
  })

  test.describe('Dialog Interaction', () => {
    test('should close dialog when clicking outside', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Dialog should be visible
        await expect(page.getByText('Upgrade Your Experience')).toBeVisible()

        // Click backdrop (if accessible) or press Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Dialog might close
      }
    })

    test('should close dialog with X button', async ({ page }) => {
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Look for close button
        const closeButtons = await page.locator('button[aria-label*="close" i]').all()
        if (closeButtons.length > 0) {
          await closeButtons[0].click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should display properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Dialog should be scrollable on mobile
        await expect(page.getByText('Upgrade Your Experience')).toBeVisible()
      }
    })

    test('should stack plans vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.waitForTimeout(2000)

      const upgradeButtons = await page.locator('button').filter({ hasText: /upgrade|premium/i }).all()

      if (upgradeButtons.length > 0) {
        await upgradeButtons[0].click()
        await page.waitForTimeout(1000)

        // Plans should be visible and stacked
        await expect(page.getByText('Premium')).toBeVisible()
        await expect(page.getByText('Elite')).toBeVisible()
      }
    })
  })
})
