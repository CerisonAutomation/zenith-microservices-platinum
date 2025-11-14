import { Router, Request, Response } from 'express';
import { stripe } from '../utils/stripe/config';
import { supabaseAdmin } from '../utils/supabase/admin';
import { PaymentMethodResponse, ErrorResponse } from '../types';

const router = Router();

/**
 * GET /methods/:customerId
 * Get all payment methods for a customer
 */
router.get('/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customerId',
      } as ErrorResponse);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const response: PaymentMethodResponse[] = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : undefined,
    }));

    res.json(response);
  } catch (error: any) {
    console.error('Error retrieving payment methods:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment methods',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * GET /methods/user/:userId
 * Get all payment methods for a user by userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!supabaseAdmin) {
      return res.status(500).json({
        error: 'Database not configured',
      } as ErrorResponse);
    }

    // Get customer ID from database
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error || !customer) {
      return res.status(404).json({
        error: 'Customer not found',
      } as ErrorResponse);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripe_customer_id,
      type: 'card',
    });

    const response: PaymentMethodResponse[] = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        : undefined,
    }));

    res.json(response);
  } catch (error: any) {
    console.error('Error retrieving payment methods:', error);
    res.status(500).json({
      error: 'Failed to retrieve payment methods',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * POST /methods/attach
 * Attach a payment method to a customer
 */
router.post('/attach', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId, customerId, setAsDefault = false } = req.body;

    if (!paymentMethodId || !customerId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'paymentMethodId and customerId are required',
      } as ErrorResponse);
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    const response: PaymentMethodResponse = {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card
        ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          }
        : undefined,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({
      error: 'Failed to attach payment method',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * DELETE /methods/:paymentMethodId
 * Detach a payment method from a customer
 */
router.delete('/:paymentMethodId', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.params;

    if (!paymentMethodId) {
      return res.status(400).json({
        error: 'Missing paymentMethodId',
      } as ErrorResponse);
    }

    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      success: true,
      id: paymentMethod.id,
      detached: true,
    });
  } catch (error: any) {
    console.error('Error detaching payment method:', error);
    res.status(500).json({
      error: 'Failed to detach payment method',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * PUT /methods/:paymentMethodId/default
 * Set a payment method as default for a customer
 */
router.put('/:paymentMethodId/default', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.params;
    const { customerId } = req.body;

    if (!paymentMethodId || !customerId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'paymentMethodId and customerId are required',
      } as ErrorResponse);
    }

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({
      success: true,
      paymentMethodId,
      setAsDefault: true,
    });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({
      error: 'Failed to set default payment method',
      message: error.message,
    } as ErrorResponse);
  }
});

/**
 * POST /methods/setup-intent
 * Create a SetupIntent for adding a payment method
 */
router.post('/setup-intent', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        error: 'Missing customerId',
      } as ErrorResponse);
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({
      error: 'Failed to create setup intent',
      message: error.message,
    } as ErrorResponse);
  }
});

export default router;
