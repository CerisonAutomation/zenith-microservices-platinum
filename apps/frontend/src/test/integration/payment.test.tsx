import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import SubscriptionDialog from '@/components/subscription/SubscriptionDialog'
import { mockLoadStripe, mockStripe } from '../mocks/stripe'
import '../mocks/stripe'
import '../mocks/supabase'

describe('Payment Integration Tests', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Subscription Purchase Flow', () => {
    it('should handle Premium subscription purchase', async () => {
      mockLoadStripe.mockResolvedValue(mockStripe)
      mockStripe.redirectToCheckout.mockResolvedValue({ error: null })

      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const subscribeButtons = screen.getAllByText('Subscribe Now')
      fireEvent.click(subscribeButtons[0]) // Premium plan

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('should handle Elite subscription purchase', async () => {
      mockLoadStripe.mockResolvedValue(mockStripe)
      mockStripe.redirectToCheckout.mockResolvedValue({ error: null })

      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const subscribeButtons = screen.getAllByText('Subscribe Now')
      fireEvent.click(subscribeButtons[1]) // Elite plan

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('should load Stripe when subscription is initiated', async () => {
      mockLoadStripe.mockResolvedValue(mockStripe)

      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const subscribeButtons = screen.getAllByText('Subscribe Now')
      fireEvent.click(subscribeButtons[0])

      await waitFor(() => {
        expect(mockLoadStripe).toHaveBeenCalled()
      })
    })
  })

  describe('Payment Error Handling', () => {
    it('should handle Stripe load failure', async () => {
      mockLoadStripe.mockResolvedValue(null)

      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const subscribeButtons = screen.getAllByText('Subscribe Now')
      fireEvent.click(subscribeButtons[0])

      await waitFor(() => {
        expect(mockLoadStripe).toHaveBeenCalled()
      })
    })

    it('should handle checkout error', async () => {
      mockLoadStripe.mockResolvedValue(mockStripe)
      mockStripe.redirectToCheckout.mockResolvedValue({
        error: { message: 'Payment failed' },
      } as any)

      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const subscribeButtons = screen.getAllByText('Subscribe Now')
      fireEvent.click(subscribeButtons[0])

      await waitFor(() => {
        expect(mockStripe.redirectToCheckout).toHaveBeenCalled()
      })
    })
  })

  describe('Subscription Plan Display', () => {
    it('should display correct pricing for Premium plan', () => {
      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('$9.99')).toBeInTheDocument()
    })

    it('should display correct pricing for Elite plan', () => {
      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('$19.99')).toBeInTheDocument()
    })

    it('should show all Premium features', () => {
      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const premiumFeatures = [
        'Unlimited likes & matches',
        'See who liked you',
        'Advanced filters',
      ]

      premiumFeatures.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    it('should show all Elite features', () => {
      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const eliteFeatures = [
        'Everything in Premium',
        'Priority placement',
        'Video chat',
      ]

      eliteFeatures.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })
  })

  describe('NFT Membership', () => {
    it('should display NFT membership option', () => {
      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      expect(screen.getByText('NFT Lifetime Membership')).toBeInTheDocument()
      expect(screen.getByText('Learn More')).toBeInTheDocument()
    })

    it('should handle NFT membership learn more click', () => {
      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const learnMoreButton = screen.getByText('Learn More')
      fireEvent.click(learnMoreButton)

      // Should not close the dialog
      expect(mockOnOpenChange).not.toHaveBeenCalled()
    })
  })

  describe('Payment Security', () => {
    it('should display payment security information', () => {
      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const securityTexts = screen.getAllByText(/Cancel anytime • Secure payment via Stripe/)
      expect(securityTexts.length).toBeGreaterThan(0)
    })
  })

  describe('Dialog Control', () => {
    it('should close dialog after successful subscription', async () => {
      mockLoadStripe.mockResolvedValue(mockStripe)
      mockStripe.redirectToCheckout.mockResolvedValue({ error: null })

      render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

      const subscribeButtons = screen.getAllByText('Subscribe Now')
      fireEvent.click(subscribeButtons[0])

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })
})
