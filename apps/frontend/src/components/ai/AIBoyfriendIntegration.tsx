/**
 * 💬 AI BOYFRIEND INTEGRATION
 * Combines floating button, chat, and subscription dialogs into one integrated system
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAIBoyfriend } from '@/contexts/AIBoyfriendContext';
import { useToast } from '@/components/ui/use-toast';
import AIBoyfriendChat from './AIBoyfriendChat';
import AIBoyfriendFloatingButton from './AIBoyfriendFloatingButton';
import SubscriptionPlansDialog from '../subscription/SubscriptionPlansDialog';
import { SubscriptionTier, SUBSCRIPTION_PLANS } from '@/lib/subscriptions';

export default function AIBoyfriendIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isChatOpen,
    closeChat,
    isSubscriptionDialogOpen,
    openSubscriptionDialog,
    closeSubscriptionDialog,
    userName,
    setUserName
  } = useAIBoyfriend();

  // Track current user's subscription tier (default to FREE for now)
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);

  // Update userName when user loads
  useEffect(() => {
    if (user?.user_metadata?.name) {
      setUserName(user.user_metadata.name);
    } else if (user?.email) {
      // Extract name from email if no name is set
      const emailName = user.email.split('@')[0];
      setUserName(emailName);
    }
  }, [user, setUserName]);

  // Handle plan selection
  const handleSelectPlan = async (tier: SubscriptionTier) => {
    // TODO: Integrate with Stripe payment flow
    console.log('Selected plan:', tier);

    if (tier === SubscriptionTier.FREE || tier === SubscriptionTier.GUEST) {
      // Free plans can be activated immediately
      setCurrentTier(tier);
      closeSubscriptionDialog();
      toast({
        title: 'Plan Updated!',
        description: `You're now on the ${SUBSCRIPTION_PLANS[tier].name} plan.`,
      });
    } else {
      // Premium/Elite plans need payment
      toast({
        title: 'Stripe Payment Coming Soon!',
        description: `${SUBSCRIPTION_PLANS[tier].name} plan will be available once Stripe integration is complete.`,
      });
    }
  };

  return (
    <>
      {/* Floating button to open chat */}
      <AIBoyfriendFloatingButton />

      {/* AI Boyfriend Chat */}
      <AIBoyfriendChat
        isOpen={isChatOpen}
        onClose={closeChat}
        userName={userName}
        onUpgradePrompt={openSubscriptionDialog}
      />

      {/* Subscription Plans Dialog */}
      <SubscriptionPlansDialog
        open={isSubscriptionDialogOpen}
        onOpenChange={closeSubscriptionDialog}
        currentTier={currentTier}
        onSelectPlan={handleSelectPlan}
      />
    </>
  );
}
