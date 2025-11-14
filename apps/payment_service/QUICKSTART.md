# Payment Service - Quick Start Guide

Get the payment service running in 5 minutes.

## 1. Install Dependencies

```bash
cd apps/payment_service
npm install
```

## 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required variables:
```env
STRIPE_SECRET_KEY=sk_test_...          # From Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_...     # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...        # From Stripe CLI or Dashboard
NEXT_PUBLIC_SUPABASE_URL=https://...   # From Supabase Dashboard
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # From Supabase Dashboard
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # From Supabase Dashboard
```

## 3. Set Up Database

```bash
# Run the migration in Supabase SQL Editor
# Copy contents of migrations/001_initial_schema.sql
# Paste in Supabase Dashboard > SQL Editor > Run
```

## 4. Start the Service

```bash
# Development mode with auto-reload
npm run dev

# Service will run on http://localhost:3002
```

## 5. Test the Service

```bash
# Check health
curl http://localhost:3002/health

# View available endpoints
curl http://localhost:3002/
```

## 6. Set Up Webhook Forwarding (Development)

In a separate terminal:

```bash
# Install Stripe CLI if not already installed
# https://stripe.com/docs/stripe-cli#install

# Login to Stripe
stripe login

# Forward webhooks to local server
npm run stripe:listen

# Copy the webhook secret (whsec_xxx) and update .env
```

## 7. Test Checkout Flow

```bash
# Create a test checkout session
curl -X POST http://localhost:3002/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_1234567890",
    "userId": "user_123",
    "email": "test@example.com"
  }'

# You'll get back a checkout URL - visit it in your browser
```

## 8. Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Common Issues

### "STRIPE_SECRET_KEY is not set"
- Make sure you copied .env.example to .env
- Add your Stripe secret key from Stripe Dashboard

### "Supabase admin not configured"
- Check your Supabase credentials in .env
- Make sure SUPABASE_SERVICE_ROLE_KEY is set

### Webhooks not working
- Make sure Stripe CLI is running: `npm run stripe:listen`
- Update STRIPE_WEBHOOK_SECRET in .env with the value from Stripe CLI

### Database errors
- Run the migration SQL in Supabase Dashboard
- Check that tables exist: customers, subscriptions, products, prices

## Next Steps

1. **Create Stripe Products**: Set up your pricing in Stripe Dashboard
2. **Integrate Frontend**: See INTEGRATION.md for frontend setup
3. **Test Webhooks**: Trigger test events with `stripe trigger`
4. **Add Features**: Customize the service for your needs

## Quick Reference

### API Endpoints

- `GET /health` - Health check
- `POST /checkout/create-session` - Create checkout session
- `POST /checkout/success` - Confirm payment
- `POST /subscription/create` - Create subscription
- `PUT /subscription/update/:id` - Update subscription
- `DELETE /subscription/cancel/:id` - Cancel subscription
- `GET /subscription/user/:userId` - Get user subscriptions
- `GET /methods/:customerId` - List payment methods
- `POST /methods/attach` - Attach payment method
- `POST /webhooks/stripe` - Stripe webhook handler

### Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### Useful Commands

```bash
npm run dev          # Start development server
npm test            # Run tests
npm run build       # Build for production
npm start           # Start production server
npm run stripe:listen  # Forward webhooks locally
```

## Support

- **README.md**: Full documentation
- **INTEGRATION.md**: Frontend integration guide
- **Stripe Docs**: https://stripe.com/docs
- **Supabase Docs**: https://supabase.com/docs

## Troubleshooting

Enable debug logging:
```bash
DEBUG=* npm run dev
```

Check logs:
```bash
# The service logs all requests and webhook events
# Look for errors in the console output
```

Need help? Check the README.md for detailed troubleshooting steps.
