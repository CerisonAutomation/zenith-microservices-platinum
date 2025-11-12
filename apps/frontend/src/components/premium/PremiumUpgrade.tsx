/**
 * Premium Upgrade Component
 *
 * Features:
 * - Pricing tiers (monthly, quarterly, yearly)
 * - Feature comparison (free vs premium)
 * - Payment integration ready
 * - Special offers and savings badges
 * - Testimonials
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Check,
  X,
  Star,
  Zap,
  Crown,
  Heart,
  MessageCircle,
  Eye,
  Lock,
  Unlock,
  Grid3x3,
  Image,
  Calendar,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { DATING_APP_CONFIG } from '@/config/dating-app.config';

interface PremiumUpgradeProps {
  onUpgrade: (plan: 'monthly' | 'quarterly' | 'yearly') => void;
  onClose?: () => void;
  showComparison?: boolean;
}

export function PremiumUpgrade({ onUpgrade, onClose, showComparison = true }: PremiumUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');

  const plans = [
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: DATING_APP_CONFIG.pricing.monthly.price,
      interval: DATING_APP_CONFIG.pricing.monthly.interval,
      savings: null,
      badge: null,
      popular: false,
    },
    {
      id: 'quarterly' as const,
      name: 'Quarterly',
      price: DATING_APP_CONFIG.pricing.quarterly.price,
      interval: DATING_APP_CONFIG.pricing.quarterly.interval,
      savings: DATING_APP_CONFIG.pricing.quarterly.savings,
      badge: 'Most Popular',
      popular: true,
    },
    {
      id: 'yearly' as const,
      name: 'Yearly',
      price: DATING_APP_CONFIG.pricing.yearly.price,
      interval: DATING_APP_CONFIG.pricing.yearly.interval,
      savings: DATING_APP_CONFIG.pricing.yearly.savings,
      badge: 'Best Value',
      popular: false,
    },
  ];

  const premiumFeatures = [
    { icon: Unlock, text: 'Unlimited swipes', highlight: true },
    { icon: Eye, text: 'See all profile photos', highlight: true },
    { icon: MessageCircle, text: 'Unlimited messaging', highlight: true },
    { icon: Grid3x3, text: 'Grid view access', highlight: false },
    { icon: Image, text: 'Access hidden albums', highlight: false },
    { icon: Calendar, text: 'Booking system', highlight: false },
    { icon: Eye, text: 'See who liked you', highlight: false },
    { icon: Shield, text: 'Verified badge', highlight: false },
    { icon: Lock, text: 'Incognito mode', highlight: false },
    { icon: Star, text: 'Priority support', highlight: false },
    { icon: TrendingUp, text: 'Profile boost', highlight: false },
    { icon: X, text: 'Ad-free experience', highlight: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 mb-6"
          >
            <Crown className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
            Upgrade to Premium
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock all features and find your perfect match faster with unlimited access
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-300
                  ${
                    selectedPlan === plan.id
                      ? 'ring-4 ring-amber-500 scale-105 shadow-2xl shadow-amber-500/20'
                      : 'hover:scale-102 shadow-xl'
                  }
                  ${
                    plan.popular
                      ? 'bg-gradient-to-br from-amber-900/40 to-purple-900/40 border-2 border-amber-500/50'
                      : 'bg-black/40 border-2 border-white/10'
                  }
                  backdrop-blur-xl
                `}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute top-0 right-0 left-0">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-center py-2 font-semibold text-sm">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <CardHeader className={plan.badge ? 'pt-16' : 'pt-6'}>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-300">
                    Billed {plan.interval}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-400">/{plan.interval}</span>
                    </div>

                    {plan.savings && (
                      <Badge className="mt-2 bg-green-500 text-white border-0">
                        Save {plan.savings}
                      </Badge>
                    )}
                  </div>

                  {/* Select Button */}
                  <Button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      onUpgrade(plan.id);
                    }}
                    className={`
                      w-full h-12 text-lg font-semibold
                      ${
                        selectedPlan === plan.id
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }
                    `}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-black/40 backdrop-blur-xl border-2 border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="text-2xl text-white text-center">
                  Everything You Get with Premium
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {premiumFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        className={`
                          flex items-center gap-3 p-4 rounded-lg
                          ${
                            feature.highlight
                              ? 'bg-amber-500/20 border-2 border-amber-500/50'
                              : 'bg-white/5 border border-white/10'
                          }
                        `}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className={feature.highlight ? 'text-amber-200 font-semibold' : 'text-gray-200'}>
                          {feature.text}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Free vs Premium Comparison Table */}
            <Card className="bg-black/40 backdrop-blur-xl border-2 border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl text-white text-center">
                  Free vs Premium Comparison
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-4 px-4 text-gray-300">Feature</th>
                        <th className="text-center py-4 px-4 text-gray-300">Free</th>
                        <th className="text-center py-4 px-4 text-amber-400">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ComparisonRow
                        feature="Daily swipes"
                        free={`${DATING_APP_CONFIG.features.free.swipesPerDay}`}
                        premium="Unlimited"
                      />
                      <ComparisonRow
                        feature="Photos visible"
                        free="First photo only"
                        premium="All photos"
                      />
                      <ComparisonRow
                        feature="Messaging"
                        free={false}
                        premium={true}
                      />
                      <ComparisonRow
                        feature="See who liked you"
                        free={false}
                        premium={true}
                      />
                      <ComparisonRow
                        feature="Advanced filters"
                        free={false}
                        premium={true}
                      />
                      <ComparisonRow
                        feature="Grid view"
                        free={false}
                        premium={true}
                      />
                      <ComparisonRow
                        feature="Hidden albums"
                        free={false}
                        premium={true}
                      />
                      <ComparisonRow
                        feature="Booking system"
                        free={false}
                        premium={true}
                      />
                      <ComparisonRow
                        feature="Incognito mode"
                        free={false}
                        premium={true}
                      />
                      <ComparisonRow
                        feature="Priority support"
                        free={false}
                        premium={true}
                      />
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            What Our Premium Members Say
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Alex M.',
                quote: 'Premium is worth every penny. I found my boyfriend within a week!',
                rating: 5,
              },
              {
                name: 'Jordan P.',
                quote: 'The unlimited swipes and messaging made all the difference.',
                rating: 5,
              },
              {
                name: 'Chris T.',
                quote: 'Grid view is amazing. I can browse so many more profiles now.',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-xl border border-white/10"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                  <p className="text-white font-semibold">- {testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={() => onUpgrade(selectedPlan)}
            size="lg"
            className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-2xl shadow-amber-500/20"
          >
            <Crown className="w-6 h-6 mr-3" />
            Upgrade to {plans.find((p) => p.id === selectedPlan)?.name} Premium
          </Button>

          <p className="text-gray-400 mt-4 text-sm">
            Cancel anytime. No hidden fees. 30-day money-back guarantee.
          </p>
        </motion.div>

        {/* Close Button */}
        {onClose && (
          <div className="text-center mt-8">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Maybe later
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Comparison Row Component
function ComparisonRow({
  feature,
  free,
  premium,
}: {
  feature: string;
  free: string | boolean;
  premium: string | boolean;
}) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-4 px-4 text-gray-300">{feature}</td>
      <td className="py-4 px-4 text-center">
        {typeof free === 'boolean' ? (
          free ? (
            <Check className="w-5 h-5 text-green-400 mx-auto" />
          ) : (
            <X className="w-5 h-5 text-red-400 mx-auto" />
          )
        ) : (
          <span className="text-gray-400">{free}</span>
        )}
      </td>
      <td className="py-4 px-4 text-center">
        {typeof premium === 'boolean' ? (
          premium ? (
            <Check className="w-5 h-5 text-amber-400 mx-auto" />
          ) : (
            <X className="w-5 h-5 text-red-400 mx-auto" />
          )
        ) : (
          <span className="text-amber-400 font-semibold">{premium}</span>
        )}
      </td>
    </tr>
  );
}
