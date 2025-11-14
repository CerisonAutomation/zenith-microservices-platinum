import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from '../utils/stripe/config';
import {
  upsertProductRecord,
  upsertPriceRecord,
  manageSubscriptionStatusChange,
  deleteProductRecord,
  deletePriceRecord,
} from '../utils/supabase/admin';

const router = Router();

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events
 */
router.post(
  '/stripe',
  // Use raw body for webhook signature verification
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = STRIPE_CONFIG.webhookSecret;

    let event: Stripe.Event;

    try {
      if (!signature || !webhookSecret) {
        console.error('Missing webhook signature or secret');
        return res.status(400).send('Webhook signature or secret not found');
      }

      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );

      console.log(`🔔 Webhook received: ${event.type}`);
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle relevant events
    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case 'product.created':
          case 'product.updated':
            console.log(`Handling product event: ${event.type}`);
            await upsertProductRecord(event.data.object as Stripe.Product);
            break;

          case 'product.deleted':
            console.log('Handling product deleted event');
            await deleteProductRecord(event.data.object as Stripe.Product);
            break;

          case 'price.created':
          case 'price.updated':
            console.log(`Handling price event: ${event.type}`);
            await upsertPriceRecord(event.data.object as Stripe.Price);
            break;

          case 'price.deleted':
            console.log('Handling price deleted event');
            await deletePriceRecord(event.data.object as Stripe.Price);
            break;

          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            console.log(`Handling subscription event: ${event.type}`);
            const subscription = event.data.object as Stripe.Subscription;
            await manageSubscriptionStatusChange(
              subscription.id,
              subscription.customer as string,
              event.type === 'customer.subscription.created'
            );
            break;

          case 'checkout.session.completed':
            console.log('Handling checkout session completed event');
            const checkoutSession = event.data.object as Stripe.Checkout.Session;

            if (checkoutSession.mode === 'subscription') {
              const subscriptionId = checkoutSession.subscription;
              await manageSubscriptionStatusChange(
                subscriptionId as string,
                checkoutSession.customer as string,
                true
              );
            }
            break;

          case 'invoice.payment_succeeded':
            console.log('Handling invoice payment succeeded event');
            const invoice = event.data.object as Stripe.Invoice;

            if (invoice.billing_reason === 'subscription_cycle') {
              const subscriptionId = invoice.subscription;
              const customerId = invoice.customer;

              console.log(
                `Successfully processed subscription renewal for ${customerId}`
              );

              // You can add custom logic here, e.g., reset usage counters
            }
            break;

          case 'invoice.payment_failed':
            console.log('Handling invoice payment failed event');
            const failedInvoice = event.data.object as Stripe.Invoice;

            console.error(
              `Payment failed for customer ${failedInvoice.customer}`
            );

            // You can add custom logic here, e.g., send notification to user
            break;

          default:
            console.warn(`Unhandled relevant event: ${event.type}`);
        }

        console.log(`✅ Successfully processed ${event.type}`);
      } catch (error: any) {
        console.error(`Error handling event ${event.type}:`, error);
        return res.status(400).json({
          error: 'Webhook handler failed',
          message: error.message,
        });
      }
    } else {
      console.log(`Ignoring unsupported event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

export default router;
