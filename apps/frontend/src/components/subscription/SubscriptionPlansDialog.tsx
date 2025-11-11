/**
 * 💎 SUBSCRIPTION PLANS DIALOG
 * Beautiful, conversion-optimized subscription selection UI
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionTier, formatPrice } from '@/lib/subscriptions';
import type { SubscriptionPlan } from '@/lib/subscriptions';

interface SubscriptionPlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: SubscriptionTier;
  onSelectPlan: (tier: SubscriptionTier) => void;
}

const tierIcons = {
  guest: Star,
  free: Zap,
  premium: Zap,
  elite: Crown,
};

const tierColors = {
  guest: 'from-gray-500 to-gray-700',
  free: 'from-blue-500 to-blue-700',
  premium: 'from-purple-500 to-pink-600',
  elite: 'from-amber-500 to-amber-700',
};

export default function SubscriptionPlansDialog({
  open,
  onOpenChange,
  currentTier = SubscriptionTier.FREE,
  onSelectPlan,
}: SubscriptionPlansDialogProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentTier);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    onSelectPlan(tier);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 backdrop-blur-xl border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent">
            Choose Your Zenith Plan
          </DialogTitle>
          <p className="text-center text-gray-300 mt-2">
            Unlock premium features and find your perfect match faster
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => {
            const Icon = tierIcons[plan.id];
            const isPopular = plan.id === SubscriptionTier.PREMIUM;
            const isCurrent = plan.id === currentTier;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border-2 transition-all ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                    Most Popular
                  </Badge>
                )}

                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-700 text-white border-0">
                    Current Plan
                  </Badge>
                )}

                <div className="flex flex-col items-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierColors[plan.id]} flex items-center justify-center mb-3`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>

                  <div className="mt-3">
                    <span className="text-4xl font-bold text-amber-400">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400 ml-1">/month</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent}
                  className={`w-full ${
                    isCurrent
                      ? 'bg-gray-700 cursor-not-allowed'
                      : isPopular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                      : 'bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800'
                  } text-white font-semibold py-3 rounded-lg transition-all`}
                >
                  {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Start Free' : 'Upgrade Now'}
                </Button>

                {plan.id === SubscriptionTier.GUEST && (
                  <p className="text-xs text-center text-gray-400 mt-3">
                    No credit card required • 7-day trial
                  </p>
                )}

                {plan.id === SubscriptionTier.PREMIUM && (
                  <p className="text-xs text-center text-gray-400 mt-3">
                    3-day free trial included
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-center text-gray-300 text-sm">
            All plans include our exclusive{' '}
            <span className="text-pink-400 font-semibold">AI Boyfriend companion</span> •
            Cancel anytime • Secure payments via Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
