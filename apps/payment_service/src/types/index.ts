export interface CheckoutSessionRequest {
  priceId: string;
  userId: string;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface CheckoutSuccessRequest {
  sessionId: string;
}

export interface SubscriptionCreateRequest {
  priceId: string;
  userId: string;
  email: string;
  paymentMethodId?: string;
}

export interface SubscriptionUpdateRequest {
  priceId?: string;
  cancel_at_period_end?: boolean;
}

export interface SubscriptionResponse {
  id: string;
  status: string;
  customerId: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  priceId: string;
}

export interface PaymentMethodResponse {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

export interface ErrorResponse {
  error: string;
  message?: string;
}
