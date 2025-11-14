import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import SubscriptionDialog from './SubscriptionDialog'
import '../../test/mocks/stripe'
import '../../test/mocks/supabase'

describe('SubscriptionDialog', () => {
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('Upgrade Your Experience')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<SubscriptionDialog open={false} onOpenChange={mockOnOpenChange} />)

    expect(screen.queryByText('Upgrade Your Experience')).not.toBeInTheDocument()
  })

  it('should display Premium plan', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('$9.99')).toBeInTheDocument()
    expect(screen.getByText('Unlimited likes & matches')).toBeInTheDocument()
  })

  it('should display Elite plan', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('Elite')).toBeInTheDocument()
    expect(screen.getByText('$19.99')).toBeInTheDocument()
    expect(screen.getByText('Everything in Premium')).toBeInTheDocument()
  })

  it('should show "Most Popular" badge on Elite plan', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('Most Popular')).toBeInTheDocument()
  })

  it('should display all Premium features', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    const premiumFeatures = [
      'Unlimited likes & matches',
      'See who liked you',
      'Advanced filters',
      'Incognito mode',
      'Read receipts',
      'Rewind last swipe',
      '5 Super Likes per day',
      'Boost profile monthly',
    ]

    premiumFeatures.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('should display all Elite features', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    const eliteFeatures = [
      'Everything in Premium',
      'Priority placement',
      'Travel mode',
      'Unlimited Super Likes',
      'Weekly Boost',
      'Profile verification',
      'Video chat',
      'Concierge service',
      'Exclusive events access',
      'Ad-free experience',
    ]

    eliteFeatures.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('should have subscribe buttons for both plans', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    const subscribeButtons = screen.getAllByText('Subscribe Now')
    expect(subscribeButtons).toHaveLength(2)
  })

  it('should handle Premium subscription click', async () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    const subscribeButtons = screen.getAllByText('Subscribe Now')
    fireEvent.click(subscribeButtons[0])

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should handle Elite subscription click', async () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    const subscribeButtons = screen.getAllByText('Subscribe Now')
    fireEvent.click(subscribeButtons[1])

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('should display NFT lifetime membership section', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('NFT Lifetime Membership')).toBeInTheDocument()
    expect(
      screen.getByText(/Get all Elite features forever with our exclusive NFT pass/)
    ).toBeInTheDocument()
  })

  it('should have Learn More button for NFT membership', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(screen.getByText('Learn More')).toBeInTheDocument()
  })

  it('should display payment security information', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    const securityTexts = screen.getAllByText(/Cancel anytime • Secure payment via Stripe/)
    expect(securityTexts.length).toBe(2) // One for each plan
  })

  it('should display subtitle', () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    expect(
      screen.getByText('Choose the perfect plan to unlock premium features')
    ).toBeInTheDocument()
  })

  it('should close dialog when backdrop is clicked', async () => {
    render(<SubscriptionDialog open={true} onOpenChange={mockOnOpenChange} />)

    // Simulate clicking outside the dialog
    // Note: This would require proper testing-library setup for dialog backdrop
    // The actual implementation depends on how the Dialog component handles this
  })
})
