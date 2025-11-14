# Payment Service Integration Guide

This guide explains how to integrate the Payment Service with your Zenith application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Stripe Configuration](#stripe-configuration)
- [Frontend Integration](#frontend-integration)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

## Prerequisites

1. **Stripe Account**: Create a Stripe account at https://stripe.com
2. **Supabase Project**: Set up a Supabase project at https://supabase.com
3. **Node.js**: Version 18 or higher
4. **Stripe CLI**: Install from https://stripe.com/docs/stripe-cli

## Database Setup

### Step 1: Run Migration

Execute the migration SQL in your Supabase SQL editor:

```bash
# Navigate to your Supabase project
# SQL Editor > New Query > Paste the contents of migrations/001_initial_schema.sql
# Click "Run"
```

Or use the Supabase CLI:

```bash
supabase db push
```

### Step 2: Verify Tables

Verify that the following tables were created:
- `customers`
- `subscriptions`
- `products`
- `prices`

### Step 3: Enable Realtime (Optional)

If you want real-time subscription updates:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
```

## Stripe Configuration

### Step 1: Get API Keys

1. Go to Stripe Dashboard > Developers > API keys
2. Copy your **Publishable key** and **Secret key**
3. For testing, use test mode keys (starting with `pk_test_` and `sk_test_`)

### Step 2: Create Products and Prices

```bash
# Using Stripe CLI
stripe products create --name="Premium Plan" --description="Premium subscription"
stripe prices create --product=prod_xxx --unit-amount=999 --currency=usd --recurring[interval]=month
```

Or use the Stripe Dashboard:
1. Go to Products > Add Product
2. Create your product with pricing

### Step 3: Setup Webhooks

#### Development (Local)

```bash
# Terminal 1: Start the payment service
npm run dev

# Terminal 2: Forward webhooks to your local server
npm run stripe:listen

# Copy the webhook signing secret (whsec_xxx) and add to .env
```

#### Production

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `product.created`
   - `product.updated`
   - `product.deleted`
   - `price.created`
   - `price.updated`
   - `price.deleted`
5. Copy the signing secret and add to production environment

## Frontend Integration

### Step 1: Install Dependencies

```bash
npm install @stripe/stripe-js
```

### Step 2: Create Payment Service Client

Create a file: `lib/payment-service.ts`

```typescript
const PAYMENT_SERVICE_URL = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3002';

export class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = PAYMENT_SERVICE_URL;
  }

  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    email: string;
    successUrl?: string;
    cancelUrl?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/checkout/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    return response.json();
  }

  async getUserSubscriptions(userId: string) {
    const response = await fetch(`${this.baseUrl}/subscription/user/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }

    return response.json();
  }

  async cancelSubscription(subscriptionId: string, immediate = false) {
    const response = await fetch(
      `${this.baseUrl}/subscription/cancel/${subscriptionId}?immediate=${immediate}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    return response.json();
  }

  async reactivateSubscription(subscriptionId: string) {
    const response = await fetch(
      `${this.baseUrl}/subscription/reactivate/${subscriptionId}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reactivate subscription');
    }

    return response.json();
  }
}

export const paymentService = new PaymentService();
```

### Step 3: Update Subscription Dialog

Update your existing `SubscriptionDialog.tsx`:

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { paymentService } from '@/lib/payment-service';
import { useUser } from '@/hooks/useUser'; // Your auth hook

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      // Redirect to login
      return;
    }

    try {
      setLoading(true);

      // Create checkout session
      const { url } = await paymentService.createCheckoutSession({
        priceId,
        userId: user.id,
        email: user.email!,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/subscription`,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Show error toast
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### Step 4: Create Success Page

Create: `app/subscription/success/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { paymentService } from '@/lib/payment-service';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Optional: Verify the session
    fetch(`http://localhost:3002/checkout/session/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.payment_status === 'paid') {
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') {
    return <div>Processing your subscription...</div>;
  }

  if (status === 'error') {
    return <div>Something went wrong. Please contact support.</div>;
  }

  return (
    <div>
      <h1>Subscription Successful!</h1>
      <p>Thank you for subscribing. Your premium features are now active.</p>
      <a href="/dashboard">Go to Dashboard</a>
    </div>
  );
}
```

### Step 5: Create Subscription Management Page

Create: `app/subscription/manage/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { paymentService } from '@/lib/payment-service';
import { useUser } from '@/hooks/useUser';

export default function ManageSubscriptionPage() {
  const { user } = useUser();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    paymentService
      .getUserSubscriptions(user.id)
      .then(setSubscriptions)
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      await paymentService.cancelSubscription(subscriptionId);
      // Refresh subscriptions
      const updated = await paymentService.getUserSubscriptions(user!.id);
      setSubscriptions(updated);
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  const handleReactivate = async (subscriptionId: string) => {
    try {
      await paymentService.reactivateSubscription(subscriptionId);
      // Refresh subscriptions
      const updated = await paymentService.getUserSubscriptions(user!.id);
      setSubscriptions(updated);
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Manage Subscriptions</h1>
      {subscriptions.map((sub: any) => (
        <div key={sub.id}>
          <h3>{sub.plan_name}</h3>
          <p>Status: {sub.status}</p>
          <p>
            Current period ends:{' '}
            {new Date(sub.current_period_end).toLocaleDateString()}
          </p>

          {sub.cancel_at_period_end ? (
            <>
              <p>Will cancel at period end</p>
              <button onClick={() => handleReactivate(sub.stripe_subscription_id)}>
                Reactivate
              </button>
            </>
          ) : (
            <button onClick={() => handleCancel(sub.stripe_subscription_id)}>
              Cancel Subscription
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Testing

### Test Checkout Flow

1. Start the payment service: `npm run dev`
2. Start the frontend: `npm run dev` (in frontend directory)
3. Click "Subscribe" button
4. Use Stripe test card: `4242 4242 4242 4242`
5. Any future date and CVV
6. Complete checkout

### Test Webhooks

```bash
# Trigger webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Monitor Webhook Delivery

- Check Stripe Dashboard > Developers > Webhooks
- View delivery attempts and responses
- Resend failed events

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
PORT=3002
NODE_ENV=production

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# URLs
SUCCESS_URL=https://your-domain.com/subscription/success
CANCEL_URL=https://your-domain.com/subscription
```

### Deploy Service

#### Docker

```bash
# Build image
docker build -t payment-service .

# Run container
docker run -p 3002:3002 --env-file .env payment-service
```

#### Cloud Platforms

- **Vercel**: Not recommended (needs long-running server)
- **Railway**: Perfect for Express apps
- **Fly.io**: Great for microservices
- **AWS ECS/Fargate**: Enterprise solution
- **DigitalOcean App Platform**: Simple deployment

### Configure Production Webhook

1. Update webhook endpoint in Stripe Dashboard
2. Use production webhook secret
3. Monitor webhook delivery
4. Set up error alerts

## Security Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Verify webhook signatures
- [ ] Implement rate limiting
- [ ] Add authentication middleware
- [ ] Configure CORS for your domain only
- [ ] Enable RLS in Supabase
- [ ] Monitor for suspicious activity
- [ ] Set up error tracking
- [ ] Regular security audits

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook endpoint is publicly accessible
2. Verify webhook secret matches
3. Check firewall settings
4. Review Stripe webhook logs

### Customer Not Created

1. Verify Supabase credentials
2. Check database connection
3. Review service logs
4. Ensure user exists in auth.users

### Subscription Not Syncing

1. Check webhook events are being received
2. Verify customer metadata includes user ID
3. Review database logs
4. Check Supabase RLS policies

## Support

For issues:
1. Check service logs: `docker logs <container-id>`
2. Review Stripe Dashboard logs
3. Check Supabase logs
4. Review API response errors

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
