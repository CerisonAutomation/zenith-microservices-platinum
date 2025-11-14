import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase credentials not configured. Admin functions will not work.');
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Upsert a product record in Supabase
 */
export const upsertProductRecord = async (product: Stripe.Product) => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin not configured');
    return;
  }

  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  const { error } = await supabaseAdmin.from('products').upsert([productData]);

  if (error) {
    console.error('Error upserting product:', error);
    throw error;
  }

  console.log(`Product ${product.id} upserted successfully`);
};

/**
 * Delete a product record from Supabase
 */
export const deleteProductRecord = async (product: Stripe.Product) => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin not configured');
    return;
  }

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', product.id);

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }

  console.log(`Product ${product.id} deleted successfully`);
};

/**
 * Upsert a price record in Supabase
 */
export const upsertPriceRecord = async (price: Stripe.Price) => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin not configured');
    return;
  }

  const priceData = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : price.product.id,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };

  const { error } = await supabaseAdmin.from('prices').upsert([priceData]);

  if (error) {
    console.error('Error upserting price:', error);
    throw error;
  }

  console.log(`Price ${price.id} upserted successfully`);
};

/**
 * Delete a price record from Supabase
 */
export const deletePriceRecord = async (price: Stripe.Price) => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin not configured');
    return;
  }

  const { error } = await supabaseAdmin
    .from('prices')
    .delete()
    .eq('id', price.id);

  if (error) {
    console.error('Error deleting price:', error);
    throw error;
  }

  console.log(`Price ${price.id} deleted successfully`);
};

/**
 * Manage subscription status changes in Supabase
 */
export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  if (!supabaseAdmin) {
    console.warn('Supabase admin not configured');
    return;
  }

  // Get the subscription from Stripe
  const { stripe } = await import('../stripe/config');
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  });

  // Get the customer's user ID from metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;

  if (!userId) {
    console.error('No supabase_user_id found in customer metadata');
    throw new Error('Customer does not have a supabase_user_id');
  }

  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items.data[0].price.id,
    status: subscription.status,
    plan_name: subscription.items.data[0].price.nickname || 'Premium',
    plan_type: subscription.items.data[0].price.recurring?.interval || 'month',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    created_at: new Date(subscription.created * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert([subscriptionData]);

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }

  console.log(`Subscription ${subscriptionId} ${createAction ? 'created' : 'updated'} successfully`);
};

/**
 * Create or retrieve a Stripe customer for a user
 */
export const createOrRetrieveCustomer = async ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not configured');
  }

  // Check if customer already exists in Supabase
  const { data: existingCustomer } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  // Create new customer in Stripe
  const { stripe } = await import('../stripe/config');
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Store customer ID in Supabase
  const { error } = await supabaseAdmin.from('customers').upsert([
    {
      id: userId,
      stripe_customer_id: customer.id,
    },
  ]);

  if (error) {
    console.error('Error storing customer:', error);
    throw error;
  }

  console.log(`Customer ${customer.id} created for user ${userId}`);
  return customer.id;
};
