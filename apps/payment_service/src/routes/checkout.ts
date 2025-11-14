import { Router, Request, Response } from 'express';
import { stripe, STRIPE_CONFIG } from '../utils/stripe/config';
import { createOrRetrieveCustomer } from '../utils/supabase/admin';
import {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CheckoutSuccessRequest,
  ErrorResponse,
} from '../types';

const router = Router();

/**
 * POST /checkout/create-session
 * Create a Stripe Checkout session
 */
router.post('/create-session', async (req: Request, res: Response) => {
  try {
    const {
      priceId,
      userId,
      email,
      successUrl,
      cancelUrl,
      metadata = {},
    }: CheckoutSessionRequest = req.body;

    // Validate required fields
    if (!priceId || !userId || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'priceId, userId, and email are required',
      } as ErrorResponse);
    }

    // Create or retrieve Stripe customer
    const customerId = await createOrRetrieveCustomer({ email, userId });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${STRIPE_CONFIG.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
      metadata: {
        userId,
        ...metadata,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    const response: CheckoutSessionResponse = {
      sessionId: session.id,
      url: session.url!,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * POST /checkout/success
 * Handle successful checkout completion
 */
router.post('/success', async (req: Request, res: Response) => {
  try {
    const { sessionId }: CheckoutSuccessRequest = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId',
      } as ErrorResponse);
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      } as ErrorResponse);
    }

    // If this is a subscription, the webhook will handle database updates
    // This endpoint just confirms the session was successful
    res.json({
      success: true,
      subscriptionId: session.subscription,
      customerId: session.customer,
      status: session.payment_status,
    });
  } catch (error: any) {
    console.error('Error processing checkout success:', error);
    res.status(500).json({
      error: 'Failed to process checkout success',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * GET /checkout/session/:sessionId
 * Retrieve a checkout session
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({
      error: 'Failed to retrieve checkout session',
      message: error.message,
    } as ErrorResponse);
  }
});

export default router;
