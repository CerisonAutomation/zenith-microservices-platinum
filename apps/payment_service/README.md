# Payment Service

A production-grade payment microservice built with Express, Stripe, and Supabase for the Zenith platform.

## Features

- **Checkout Flow**: Create Stripe checkout sessions for one-time and subscription payments
- **Subscription Management**: Create, update, cancel, and reactivate subscriptions
- **Payment Methods**: Manage customer payment methods (cards)
- **Webhook Handling**: Process Stripe webhooks for automated subscription updates
- **Supabase Integration**: Persist payment data to Supabase database
- **Type Safety**: Full TypeScript support with comprehensive types
- **Testing**: Complete test coverage with Jest

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Stripe account
- Supabase project
- Stripe CLI (for webhook testing)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your credentials
```

### Environment Variables

```env
# Service Configuration
PORT=3002
NODE_ENV=development

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# URLs
SUCCESS_URL=http://localhost:3000/success
CANCEL_URL=http://localhost:3000/cancel
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start

# Listen to Stripe webhooks (in separate terminal)
npm run stripe:listen
```

## Database Schema

The service integrates with Supabase and requires the following tables:

### customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### products
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### prices
```sql
CREATE TABLE prices (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  active BOOLEAN NOT NULL,
  description TEXT,
  unit_amount BIGINT,
  currency TEXT NOT NULL,
  type TEXT NOT NULL,
  interval TEXT,
  interval_count INTEGER,
  trial_period_days INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Health Check

#### GET /health
Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "payment-service",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Checkout

#### POST /checkout/create-session
Create a Stripe checkout session for subscription payment.

**Request Body:**
```json
{
  "priceId": "price_1234567890",
  "userId": "user_uuid",
  "email": "customer@example.com",
  "successUrl": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://example.com/cancel",
  "metadata": {
    "custom_field": "custom_value"
  }
}
```

**Response:**
```json
{
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/pay/cs_test_1234567890"
}
```

**Example:**
```bash
curl -X POST http://localhost:3002/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234567890",
    "userId": "user_123",
    "email": "customer@example.com"
  }'
```

#### POST /checkout/success
Confirm successful checkout completion.

**Request Body:**
```json
{
  "sessionId": "cs_test_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_1234567890",
  "customerId": "cus_1234567890",
  "status": "paid"
}
```

#### GET /checkout/session/:sessionId
Retrieve checkout session details.

**Response:**
```json
{
  "id": "cs_test_1234567890",
  "status": "complete",
  "payment_status": "paid",
  "customer": "cus_1234567890",
  "subscription": "sub_1234567890",
  "amount_total": 999,
  "currency": "usd"
}
```

### Subscriptions

#### POST /subscription/create
Create a new subscription with or without payment method.

**Request Body:**
```json
{
  "priceId": "price_1234567890",
  "userId": "user_uuid",
  "email": "customer@example.com",
  "paymentMethodId": "pm_1234567890" // optional
}
```

**Response:**
```json
{
  "id": "sub_1234567890",
  "status": "active",
  "customerId": "cus_1234567890",
  "currentPeriodEnd": 1234567890,
  "cancelAtPeriodEnd": false,
  "priceId": "price_1234567890"
}
```

#### PUT /subscription/update/:subscriptionId
Update subscription price or cancellation settings.

**Request Body:**
```json
{
  "priceId": "price_0987654321", // optional
  "cancel_at_period_end": false // optional
}
```

**Response:**
```json
{
  "id": "sub_1234567890",
  "status": "active",
  "customerId": "cus_1234567890",
  "currentPeriodEnd": 1234567890,
  "cancelAtPeriodEnd": false,
  "priceId": "price_0987654321"
}
```

#### DELETE /subscription/cancel/:subscriptionId
Cancel a subscription (at period end or immediately).

**Query Parameters:**
- `immediate`: Set to `true` to cancel immediately (default: false)

**Example:**
```bash
# Cancel at period end
curl -X DELETE http://localhost:3002/subscription/cancel/sub_1234567890

# Cancel immediately
curl -X DELETE http://localhost:3002/subscription/cancel/sub_1234567890?immediate=true
```

**Response:**
```json
{
  "id": "sub_1234567890",
  "status": "active",
  "customerId": "cus_1234567890",
  "currentPeriodEnd": 1234567890,
  "cancelAtPeriodEnd": true,
  "priceId": "price_1234567890"
}
```

#### GET /subscription/:subscriptionId
Get subscription details.

**Response:**
```json
{
  "id": "sub_1234567890",
  "status": "active",
  "customerId": "cus_1234567890",
  "currentPeriodEnd": 1234567890,
  "cancelAtPeriodEnd": false,
  "priceId": "price_1234567890"
}
```

#### GET /subscription/user/:userId
Get all subscriptions for a user.

**Response:**
```json
[
  {
    "id": "sub_1234567890",
    "user_id": "user_uuid",
    "stripe_customer_id": "cus_1234567890",
    "stripe_subscription_id": "sub_1234567890",
    "status": "active",
    "plan_name": "Premium",
    "plan_type": "month",
    "current_period_start": "2025-11-14T00:00:00.000Z",
    "current_period_end": "2025-12-14T00:00:00.000Z",
    "cancel_at_period_end": false
  }
]
```

#### POST /subscription/reactivate/:subscriptionId
Reactivate a subscription that was set to cancel at period end.

**Response:**
```json
{
  "id": "sub_1234567890",
  "status": "active",
  "customerId": "cus_1234567890",
  "currentPeriodEnd": 1234567890,
  "cancelAtPeriodEnd": false,
  "priceId": "price_1234567890"
}
```

### Payment Methods

#### GET /methods/:customerId
List all payment methods for a customer.

**Response:**
```json
[
  {
    "id": "pm_1234567890",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    }
  }
]
```

#### GET /methods/user/:userId
List all payment methods for a user (by userId).

**Response:**
```json
[
  {
    "id": "pm_1234567890",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    }
  }
]
```

#### POST /methods/attach
Attach a payment method to a customer.

**Request Body:**
```json
{
  "paymentMethodId": "pm_1234567890",
  "customerId": "cus_1234567890",
  "setAsDefault": true // optional
}
```

**Response:**
```json
{
  "id": "pm_1234567890",
  "type": "card",
  "card": {
    "brand": "visa",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2025
  }
}
```

#### DELETE /methods/:paymentMethodId
Detach a payment method from a customer.

**Response:**
```json
{
  "success": true,
  "id": "pm_1234567890",
  "detached": true
}
```

#### PUT /methods/:paymentMethodId/default
Set a payment method as the default for a customer.

**Request Body:**
```json
{
  "customerId": "cus_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "paymentMethodId": "pm_1234567890",
  "setAsDefault": true
}
```

#### POST /methods/setup-intent
Create a SetupIntent for adding a new payment method.

**Request Body:**
```json
{
  "customerId": "cus_1234567890"
}
```

**Response:**
```json
{
  "clientSecret": "seti_1234567890_secret_abcdef",
  "setupIntentId": "seti_1234567890"
}
```

### Webhooks

#### POST /webhooks/stripe
Handle Stripe webhook events.

**Supported Events:**
- `product.created`
- `product.updated`
- `product.deleted`
- `price.created`
- `price.updated`
- `price.deleted`
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Headers:**
- `stripe-signature`: Webhook signature for verification

**Response:**
```json
{
  "received": true
}
```

## Webhook Testing

To test webhooks locally with the Stripe CLI:

```bash
# Login to Stripe CLI
stripe login

# Listen to webhooks
npm run stripe:listen

# This will output a webhook signing secret
# Update your .env with: STRIPE_WEBHOOK_SECRET=whsec_...

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing required fields, invalid data)
- `404`: Not Found
- `500`: Internal Server Error

## Integration Example

### Frontend Integration

```typescript
// Create a checkout session
const response = await fetch('http://localhost:3002/checkout/create-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    priceId: 'price_1234567890',
    userId: user.id,
    email: user.email,
    successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/cancel`,
  }),
});

const { url } = await response.json();

// Redirect to Stripe Checkout
window.location.href = url;
```

### Cancel Subscription

```typescript
const response = await fetch(
  `http://localhost:3002/subscription/cancel/${subscriptionId}`,
  {
    method: 'DELETE',
  }
);

const result = await response.json();
console.log('Subscription will cancel at:', result.currentPeriodEnd);
```

## Architecture

```
payment_service/
├── src/
│   ├── routes/
│   │   ├── checkout.ts          # Checkout endpoints
│   │   ├── subscriptions.ts     # Subscription management
│   │   ├── payment-methods.ts   # Payment method management
│   │   └── webhooks.ts          # Stripe webhook handler
│   ├── utils/
│   │   ├── stripe/
│   │   │   └── config.ts        # Stripe configuration
│   │   └── supabase/
│   │       └── admin.ts         # Supabase admin client
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── __tests__/
│   │   ├── checkout.test.ts
│   │   ├── subscriptions.test.ts
│   │   └── payment-methods.test.ts
│   └── index.ts                 # Main Express server
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Webhook Verification**: Always verify Stripe webhook signatures
3. **HTTPS**: Use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Authentication**: Add authentication middleware for user-specific endpoints
6. **CORS**: Configure CORS appropriately for your frontend domain

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
```

### Environment Setup

1. Set all environment variables in your hosting platform
2. Configure Stripe webhook endpoint in Stripe Dashboard
3. Set up database tables in Supabase
4. Enable required Stripe products and prices

### Monitoring

- Monitor webhook delivery in Stripe Dashboard
- Set up error tracking (e.g., Sentry)
- Monitor API response times
- Track subscription lifecycle events

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- ✅ Checkout session creation
- ✅ Checkout success handling
- ✅ Subscription creation
- ✅ Subscription updates
- ✅ Subscription cancellation
- ✅ Payment method management
- ✅ Error handling

## Support

For issues or questions:
- Check Stripe API documentation: https://stripe.com/docs/api
- Check Supabase documentation: https://supabase.com/docs
- Review Stripe webhook logs
- Check service logs for errors

## License

MIT

## Version

1.0.0 - Production Ready
