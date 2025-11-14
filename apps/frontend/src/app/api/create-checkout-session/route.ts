import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { rateLimit, RateLimitConfig, createRateLimitResponse } from '@/utils/rate-limit';

import { APILogger } from '@/utils/api-logger';
import { apiError, requireEnv } from '@/utils/api-helpers';
// Node.js runtime required for Stripe SDK
export const runtime = 'nodejs';

const requestSchema = z.object({
  planId: z.enum(['premium', 'elite'])
});

const plans = {
  premium: {
    name: 'Premium',
    price: 9.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium'
  },
  elite: {
    name: 'Elite',
    price: 19.99,
    priceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_elite'
  }
};

export async function POST(req: NextRequest) {
const logger = APILogger.scope('create-checkout-session');
  try {
    // Apply strict rate limiting for payment endpoints
    const { success, headers: rateLimitHeaders, result } = await rateLimit(req, RateLimitConfig.payment);

    if (!success) {
      return createRateLimitResponse(result);
    }

    // Validate Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia'
    });

    // Authenticate user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID', details: validation.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { planId } = validation.data;
    const plan = plans[planId];

    // Get or create Stripe customer
    let customerId: string;

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;

      // Store customer ID in database
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/subscription/cancel`,
      metadata: {
        user_id: user.id,
        plan_id: planId
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId
        }
      }
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Stripe checkout API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
