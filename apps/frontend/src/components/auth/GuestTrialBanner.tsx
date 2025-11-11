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
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

export default function GuestTrialBanner() {
  const { user, isGuest } = useAuth();
  const { openSubscriptionDialog } = useAIBoyfriend();
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check dismissal state from storage
  useEffect(() => {
    if (!isGuest || !user?.id) return;

    const storageKey = `zenith_banner_dismissed_${user.id}`;
    const result = safeGetItem<{ dismissedAt: number; dismissedUntil: string }>(storageKey);

    if (result.success && result.data) {
      const { dismissedAt, dismissedUntil } = result.data;
      const now = new Date();
      const dismissUntil = new Date(dismissedUntil);

      // If dismissal is still valid (before dismissedUntil), keep it dismissed
      if (now < dismissUntil) {
        setIsDismissed(true);
        console.log(`Banner dismissed until ${dismissUntil.toLocaleString()}`);
      }
    }
  }, [isGuest, user]);

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

  const handleDismiss = () => {
    setIsDismissed(true);

    if (user?.id) {
      const now = new Date();
      // Dismiss until tomorrow at 9am (good time to show reminder)
      const dismissedUntil = new Date();
      dismissedUntil.setDate(dismissedUntil.getDate() + 1);
      dismissedUntil.setHours(9, 0, 0, 0);

      const storageKey = `zenith_banner_dismissed_${user.id}`;
      safeSetItem(storageKey, {
        dismissedAt: now.getTime(),
        dismissedUntil: dismissedUntil.toISOString(),
      });

      console.log(`Banner dismissed until ${dismissedUntil.toLocaleString()}`);
    }
  };

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
              onClick={handleDismiss}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 flex-shrink-0"
              aria-label="Dismiss banner until tomorrow"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
