import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(['free', 'premium', 'premium_plus']),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  billingCycle: z.enum(['monthly', 'yearly']),
  autoRenew: z.boolean().default(true),
  paymentMethod: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  endDate: z.string().datetime().optional(),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(['free', 'premium', 'premium_plus']).optional(),
  status: z.enum(['active', 'cancelled', 'expired', 'pending']).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
  autoRenew: z.boolean().optional(),
  paymentMethod: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  endDate: z.string().datetime().optional(),
});

export const cancelSubscriptionSchema = z.object({
  cancellationReason: z.string().optional(),
});

export const subscriptionQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  status: z.string().optional(),
  plan: z.string().optional(),
});

export type CreateSubscriptionDTO = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDTO = z.infer<typeof updateSubscriptionSchema>;
export type CancelSubscriptionDTO = z.infer<typeof cancelSubscriptionSchema>;
export type SubscriptionQueryDTO = z.infer<typeof subscriptionQuerySchema>;
