/**
 * Payment Service
 * Handles Stripe payments, subscriptions, and webhooks
 */

export interface PaymentService {
  // Create checkout session
  createCheckoutSession(params: CheckoutParams): Promise<CheckoutSession>;
  
  // Manage subscriptions
  createSubscription(customerId: string, priceId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<Subscription>;
  updateSubscription(subscriptionId: string, params: UpdateParams): Promise<Subscription>;
  
  // Customer management
  createCustomer(email: string, metadata?: any): Promise<Customer>;
  getCustomer(customerId: string): Promise<Customer>;
  
  // Webhook handling
  handleWebhook(signature: string, payload: any): Promise<WebhookResult>;
  
  // Pricing
  listPrices(): Promise<Price[]>;
  getPrice(priceId: string): Promise<Price>;
}

export interface CheckoutParams {
  priceId: string;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: any;
}

export interface Subscription {
  id: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  planId: string;
}
