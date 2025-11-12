/**
 * User Mode Selection Component
 *
 * Allows users to choose their mode:
 * - Looking for a Boyfriend (client)
 * - Become a Boyfriend (service provider)
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Heart, Star, Calendar, MessageCircle, Shield, TrendingUp, Wallet } from 'lucide-react';
import { DATING_APP_CONFIG, UserMode } from '@/config/dating-app.config';

interface UserModeSelectionProps {
  onModeSelected: (mode: UserMode) => void;
}

export function UserModeSelection({ onModeSelected }: UserModeSelectionProps) {
  const [selectedMode, setSelectedMode] = useState<UserMode | null>(null);
  const [hoveredMode, setHoveredMode] = useState<UserMode | null>(null);

  const handleSelect = (mode: UserMode) => {
    setSelectedMode(mode);
    // Small delay for visual feedback
    setTimeout(() => {
      onModeSelected(mode);
    }, 300);
  };

  const modes = [
    {
      id: 'looking_for_boyfriend' as UserMode,
      title: 'Looking for a Boyfriend',
      description: 'Browse, connect, and find your perfect match',
      icon: Search,
      gradient: 'from-purple-600 to-pink-600',
      features: [
        { icon: Search, text: 'Browse unlimited profiles' },
        { icon: Heart, text: 'Swipe and match' },
        { icon: MessageCircle, text: 'Chat with matches' },
        { icon: Calendar, text: 'Book dates with boyfriends' },
      ],
      badge: 'Most Popular',
      badgeColor: 'bg-green-500',
    },
    {
      id: 'become_boyfriend' as UserMode,
      title: 'Become a Boyfriend',
      description: 'Offer companionship and dating services',
      icon: Star,
      gradient: 'from-amber-600 to-orange-600',
      features: [
        { icon: Star, text: 'Create professional profile' },
        { icon: Calendar, text: 'Manage your availability' },
        { icon: Wallet, text: 'Earn from bookings' },
        { icon: Shield, text: 'Verification required' },
      ],
      badge: 'Earn Money',
      badgeColor: 'bg-amber-500',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
          >
            Choose Your Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-300"
          >
            How would you like to use our platform?
          </motion.p>
        </div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            const isHovered = hoveredMode === mode.id;

            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.2, duration: 0.6 }}
                onHoverStart={() => setHoveredMode(mode.id)}
                onHoverEnd={() => setHoveredMode(null)}
              >
                <Card
                  className={`
                    relative overflow-hidden cursor-pointer transition-all duration-300 h-full
                    ${isSelected ? 'ring-4 ring-purple-500 scale-105' : ''}
                    ${isHovered ? 'scale-102 shadow-2xl' : 'shadow-xl'}
                    bg-black/40 backdrop-blur-xl border-2
                    ${isHovered ? 'border-purple-500/50' : 'border-white/10'}
                  `}
                  onClick={() => handleSelect(mode.id)}
                >
                  {/* Gradient Overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-10 ${
                      isHovered ? 'opacity-20' : ''
                    } transition-opacity`}
                  />

                  {/* Badge */}
                  {mode.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className={`${mode.badgeColor} text-white border-0 px-3 py-1`}>
                        {mode.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="relative z-10">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${mode.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <CardTitle className="text-2xl font-bold text-white mb-2">
                      {mode.title}
                    </CardTitle>

                    <CardDescription className="text-gray-300 text-base">
                      {mode.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10 space-y-4">
                    {/* Features List */}
                    <div className="space-y-3">
                      {mode.features.map((feature, idx) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + idx * 0.1 }}
                            className="flex items-center gap-3 text-gray-200"
                          >
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${mode.gradient} flex items-center justify-center flex-shrink-0`}>
                              <FeatureIcon className="w-4 h-4 text-white" />
                            </div>
                            <span>{feature.text}</span>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Select Button */}
                    <Button
                      className={`
                        w-full mt-6 h-12 text-lg font-semibold
                        bg-gradient-to-r ${mode.gradient}
                        hover:opacity-90 transition-opacity
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(mode.id);
                      }}
                    >
                      {isSelected ? 'Selected! Continuing...' : `Select ${mode.title.split(' ')[0]}`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <Shield className="w-5 h-5 text-green-400" />
                <p>
                  <strong className="text-white">Don't worry!</strong> You can switch modes later in your profile settings
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Info */}
        <div className="mt-8 grid md:grid-cols-2 gap-6 text-sm text-gray-400">
          <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Looking for a Boyfriend
            </h3>
            <p>
              Browse profiles, swipe to match, chat with connections, and book dates.
              Free tier includes 5 swipes per day. Premium unlocks unlimited features.
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              Become a Boyfriend
            </h3>
            <p>
              Set your availability and rates, receive booking requests, earn money.
              Requires ID and photo verification for safety. Build your reputation with reviews.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
