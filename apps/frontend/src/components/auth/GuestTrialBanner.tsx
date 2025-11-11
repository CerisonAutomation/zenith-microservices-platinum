/**
 * 🎁 GUEST TRIAL COUNTDOWN BANNER
 * Shows remaining trial days and encourages account creation
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAIBoyfriend } from '@/contexts/AIBoyfriendContext';
import { Button } from '../ui/button';
import { AlertCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestTrialBanner() {
  const { user, isGuest } = useAuth();
  const { openSubscriptionDialog } = useAIBoyfriend();
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isGuest || !user?.user_metadata?.trialEnd) return;

    const calculateDaysRemaining = () => {
      const trialEnd = new Date(user.user_metadata.trialEnd);
      const now = new Date();
      const diff = trialEnd.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, days));
    };

    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [isGuest, user]);

  if (!isGuest || isDismissed) return null;

  // Determine urgency level
  const isUrgent = daysRemaining <= 2;
  const isWarning = daysRemaining <= 4 && daysRemaining > 2;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`sticky top-0 z-50 w-full px-4 py-3 ${
          isUrgent
            ? 'bg-gradient-to-r from-red-600 to-red-700'
            : isWarning
            ? 'bg-gradient-to-r from-amber-600 to-amber-700'
            : 'bg-gradient-to-r from-purple-600 to-pink-600'
        } text-white shadow-lg`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {isUrgent ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 flex-shrink-0" />
            )}

            <div className="flex-1">
              <p className="text-sm font-semibold">
                {daysRemaining === 0 ? (
                  <>Your trial expires today! Create an account to keep your data.</>
                ) : daysRemaining === 1 ? (
                  <>Only 1 day left in your trial!</>
                ) : (
                  <>{daysRemaining} days left in your free trial</>
                )}
              </p>
              <p className="text-xs opacity-90">
                Create a free account to save your matches and conversations forever
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                // Open subscription dialog to convert to full account
                openSubscriptionDialog();
              }}
              size="sm"
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
            >
              Create Free Account
            </Button>

            <Button
              onClick={() => setIsDismissed(true)}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
