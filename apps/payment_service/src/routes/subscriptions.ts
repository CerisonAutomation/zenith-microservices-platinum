import { Router, Request, Response } from 'express';
import { stripe } from '../utils/stripe/config';
import { createOrRetrieveCustomer, supabaseAdmin } from '../utils/supabase/admin';
import {
  SubscriptionCreateRequest,
  SubscriptionUpdateRequest,
  SubscriptionResponse,
  ErrorResponse,
} from '../types';

const router = Router();

/**
 * POST /subscription/create
 * Create a new subscription
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      priceId,
      userId,
      email,
      paymentMethodId,
    }: SubscriptionCreateRequest = req.body;

    // Validate required fields
    if (!priceId || !userId || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'priceId, userId, and email are required',
      } as ErrorResponse);
    }

    // Create or retrieve Stripe customer
    const customerId = await createOrRetrieveCustomer({ email, userId });

    // If payment method provided, attach it to customer
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent', 'customer'],
      metadata: {
        userId,
      },
    });

    const response: SubscriptionResponse = {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer as string,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0].price.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * PUT /subscription/update/:subscriptionId
 * Update an existing subscription
 */
router.put('/update/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { priceId, cancel_at_period_end }: SubscriptionUpdateRequest = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Missing subscriptionId',
      } as ErrorResponse);
    }

    const updateData: any = {};

    // Update price if provided
    if (priceId) {
      // Get current subscription to find the subscription item
      const currentSub = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionItemId = currentSub.items.data[0].id;

      updateData.items = [
        {
          id: subscriptionItemId,
          price: priceId,
        },
      ];
      updateData.proration_behavior = 'create_prorations';
    }

    // Update cancellation status if provided
    if (cancel_at_period_end !== undefined) {
      updateData.cancel_at_period_end = cancel_at_period_end;
    }

    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      updateData
    );

    const response: SubscriptionResponse = {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer as string,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0].price.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      error: 'Failed to update subscription',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * DELETE /subscription/cancel/:subscriptionId
 * Cancel a subscription
 */
router.delete('/cancel/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { immediate = false } = req.query;

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Missing subscriptionId',
      } as ErrorResponse);
    }

    let subscription;

    if (immediate === 'true') {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    const response: SubscriptionResponse = {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer as string,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0].price.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * GET /subscription/:subscriptionId
 * Get subscription details
 */
router.get('/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer'],
    });

    const response: SubscriptionResponse = {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer as string,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0].price.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error retrieving subscription:', error);
    res.status(500).json({
      error: 'Failed to retrieve subscription',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * GET /subscription/user/:userId
 * Get all subscriptions for a user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!supabaseAdmin) {
      return res.status(500).json({
        error: 'Database not configured',
      } as ErrorResponse);
    }

    // Get user's subscriptions from database
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(subscriptions || []);
  } catch (error: any) {
    console.error('Error retrieving user subscriptions:', error);
    res.status(500).json({
      error: 'Failed to retrieve user subscriptions',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * POST /subscription/reactivate/:subscriptionId
 * Reactivate a canceled subscription (before period end)
 */
router.post('/reactivate/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    const response: SubscriptionResponse = {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer as string,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: subscription.items.data[0].price.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      error: 'Failed to reactivate subscription',
      message: error.message,
    } as ErrorResponse);
  }
});

export default router;
