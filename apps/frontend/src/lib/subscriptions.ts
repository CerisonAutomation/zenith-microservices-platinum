/**
 * 💎 ZENITH SUBSCRIPTION SYSTEM
 * Enterprise-grade subscription management with Stripe integration
 * Supports: Free, Premium, Elite tiers + Guest mode + Free trials
 */

import type { User } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION TIERS & PRICING
// ═══════════════════════════════════════════════════════════════════════════════

export enum SubscriptionTier {
  GUEST = 'guest',
  FREE = 'free',
  PREMIUM = 'premium',
  ELITE = 'elite',
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number; // USD per month
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  limits: {
    dailySwipes: number | 'unlimited';
    superLikes: number;
    boosts: number;
    rewinds: number | 'unlimited';
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  [SubscriptionTier.GUEST]: {
    id: SubscriptionTier.GUEST,
    name: 'Guest Trial',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'AI Boyfriend companion',
      '10 swipes per day',
      'Basic matching',
      'Chat messaging',
      '7-day trial period',
    ],
    limits: {
      dailySwipes: 10,
      superLikes: 0,
      boosts: 0,
      rewinds: 0,
    },
  },

  [SubscriptionTier.FREE]: {
    id: SubscriptionTier.FREE,
    name: 'Free Plan',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'AI Boyfriend companion (unlimited)',
      '50 swipes per day',
      'Basic matching',
      'Chat messaging',
      'Profile customization',
      'Kink & tribe matching',
    ],
    limits: {
      dailySwipes: 50,
      superLikes: 1,
      boosts: 0,
      rewinds: 0,
    },
  },

  [SubscriptionTier.PREMIUM]: {
    id: SubscriptionTier.PREMIUM,
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Everything in Free',
      'Unlimited swipes',
      'See who liked you',
      'Advanced filters',
      '5 super likes per day',
      '1 boost per month',
      'Read receipts',
      'Unlimited AI Boyfriend interactions',
      'Ad-free experience',
    ],
    limits: {
      dailySwipes: 'unlimited',
      superLikes: 5,
      boosts: 1,
      rewinds: 5,
    },
  },

  [SubscriptionTier.ELITE]: {
    id: SubscriptionTier.ELITE,
    name: 'Elite',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID,
    features: [
      'Everything in Premium',
      'Incognito mode',
      'Priority likes (shown first)',
      '10 super likes per day',
      '3 boosts per month',
      'Unlimited rewinds',
      'Advanced AI personality tuning',
      'Video/voice calls',
      'Priority support',
      'Profile boost',
      'Travel mode',
    ],
    limits: {
      dailySwipes: 'unlimited',
      superLikes: 10,
      boosts: 3,
      rewinds: 'unlimited',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION STATE
// ═══════════════════════════════════════════════════════════════════════════════

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
  subscription: UserSubscription,
  feature: string
): boolean {
  const plan = SUBSCRIPTION_PLANS[subscription.tier];
  return plan.features.some((f) => f.toLowerCase().includes(feature.toLowerCase()));
}

/**
 * Check if user has reached daily swipe limit
 */
export function canSwipe(
  subscription: UserSubscription,
  todaySwipeCount: number
): boolean {
  const plan = SUBSCRIPTION_PLANS[subscription.tier];
  if (plan.limits.dailySwipes === 'unlimited') return true;
  return todaySwipeCount < plan.limits.dailySwipes;
}

/**
 * Get remaining swipes for today
 */
export function getRemainingSwipes(
  subscription: UserSubscription,
  todaySwipeCount: number
): number | 'unlimited' {
  const plan = SUBSCRIPTION_PLANS[subscription.tier];
  if (plan.limits.dailySwipes === 'unlimited') return 'unlimited';
  return Math.max(0, plan.limits.dailySwipes - todaySwipeCount);
}

/**
 * Check if user is on trial
 */
export function isTrialing(subscription: UserSubscription): boolean {
  if (!subscription.trialEnd) return false;
  return new Date() < subscription.trialEnd;
}

/**
 * Check if subscription is active
 */
export function isActive(subscription: UserSubscription): boolean {
  return (
    subscription.status === 'active' ||
    subscription.status === 'trialing'
  );
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: UserSubscription): number {
  if (!subscription.trialEnd) return 0;
  const now = new Date();
  const trialEnd = new Date(subscription.trialEnd);
  const diff = trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Create guest trial subscription
 */
export function createGuestSubscription(): UserSubscription {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    userId: 'guest',
    tier: SubscriptionTier.GUEST,
    status: 'trialing',
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd,
    trialEnd,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Create free subscription
 */
export function createFreeSubscription(userId: string): UserSubscription {
  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  return {
    userId,
    tier: SubscriptionTier.FREE,
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: oneYear,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Format price for display
 */
export function formatPrice(plan: SubscriptionPlan): string {
  if (plan.price === 0) return 'Free';
  return `$${plan.price.toFixed(2)}/${plan.interval}`;
}

/**
 * Get upgrade path recommendations
 */
export function getUpgradePath(currentTier: SubscriptionTier): SubscriptionTier[] {
  switch (currentTier) {
    case SubscriptionTier.GUEST:
      return [SubscriptionTier.FREE, SubscriptionTier.PREMIUM, SubscriptionTier.ELITE];
    case SubscriptionTier.FREE:
      return [SubscriptionTier.PREMIUM, SubscriptionTier.ELITE];
    case SubscriptionTier.PREMIUM:
      return [SubscriptionTier.ELITE];
    case SubscriptionTier.ELITE:
      return [];
  }
}
