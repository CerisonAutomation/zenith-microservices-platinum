import { vi } from 'vitest'

// Mock Stripe object
export const mockStripe = {
  redirectToCheckout: vi.fn().mockResolvedValue({ error: null }),
  confirmCardPayment: vi.fn().mockResolvedValue({
    paymentIntent: {
      id: 'pi_test_123',
      status: 'succeeded',
    },
    error: null,
  }),
  confirmCardSetup: vi.fn().mockResolvedValue({
    setupIntent: {
      id: 'seti_test_123',
      status: 'succeeded',
    },
    error: null,
  }),
  createPaymentMethod: vi.fn().mockResolvedValue({
    paymentMethod: {
      id: 'pm_test_123',
      type: 'card',
    },
    error: null,
  }),
  createToken: vi.fn().mockResolvedValue({
    token: {
      id: 'tok_test_123',
    },
    error: null,
  }),
  elements: vi.fn().mockReturnValue({
    create: vi.fn().mockReturnValue({
      mount: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      update: vi.fn(),
    }),
  }),
}

// Mock loadStripe function
export const mockLoadStripe = vi.fn().mockResolvedValue(mockStripe)

// Mock @stripe/stripe-js module
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: mockLoadStripe,
}))

// Mock Stripe API responses
export const mockCreateCheckoutSession = {
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/pay/cs_test_123',
  payment_status: 'unpaid',
}

export const mockSubscription = {
  id: 'sub_test_123',
  status: 'active',
  current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
  plan: {
    id: 'premium',
    amount: 999,
    currency: 'usd',
    interval: 'month',
  },
}

export const mockPaymentIntent = {
  id: 'pi_test_123',
  amount: 999,
  currency: 'usd',
  status: 'succeeded',
  client_secret: 'pi_test_123_secret',
}

export default mockStripe
