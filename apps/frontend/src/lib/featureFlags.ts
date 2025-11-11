/**
 * 🎛️ Feature Toggle System
 * Runtime feature flags for safe deployments and gradual rollouts
 */

import { useAuth } from '@/contexts/AuthContext';

// Feature flag configuration
export const FEATURE_FLAGS = {
  // Core features
  AI_MATCHING: 'ai_matching',
  VIDEO_CALLS: 'video_calls',
  PREMIUM_SUBSCRIPTIONS: 'premium_subscriptions',
  ADVANCED_FILTERS: 'advanced_filters',

  // Experimental features
  NEW_ONBOARDING: 'new_onboarding',
  DARK_MODE: 'dark_mode',
  VOICE_MESSAGES: 'voice_messages',

  // Admin features
  ANALYTICS_DASHBOARD: 'analytics_dashboard',
  BULK_ACTIONS: 'bulk_actions',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

// Environment-based feature flags (server-side)
export const getServerFeatureFlags = (): Record<FeatureFlag, boolean> => ({
  [FEATURE_FLAGS.AI_MATCHING]:
    process.env['VITE_FEATURE_AI_MATCHING'] === 'true',
  [FEATURE_FLAGS.VIDEO_CALLS]:
    process.env['VITE_FEATURE_VIDEO_CALLS'] === 'true',
  [FEATURE_FLAGS.PREMIUM_SUBSCRIPTIONS]:
    process.env['VITE_FEATURE_PREMIUM_SUBSCRIPTIONS'] === 'true',
  [FEATURE_FLAGS.ADVANCED_FILTERS]:
    process.env['VITE_FEATURE_ADVANCED_FILTERS'] === 'true',
  [FEATURE_FLAGS.NEW_ONBOARDING]:
    process.env['VITE_FEATURE_NEW_ONBOARDING'] === 'true',
  [FEATURE_FLAGS.DARK_MODE]: process.env['VITE_FEATURE_DARK_MODE'] === 'true',
  [FEATURE_FLAGS.VOICE_MESSAGES]:
    process.env['VITE_FEATURE_VOICE_MESSAGES'] === 'true',
  [FEATURE_FLAGS.ANALYTICS_DASHBOARD]:
    process.env['VITE_FEATURE_ANALYTICS_DASHBOARD'] === 'true',
  [FEATURE_FLAGS.BULK_ACTIONS]:
    process.env['VITE_FEATURE_BULK_ACTIONS'] === 'true',
});

// Client-side feature flag hook with user segmentation
export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  const { user } = useAuth();

  // Get base flag value from environment
  const baseEnabled = getServerFeatureFlags()[flag];

  if (!baseEnabled) return false;

  // User-based segmentation (gradual rollout)
  if (user) {
    const userId = user.id;

    // Gradual rollout: enable for 50% of users based on user ID hash
    if (flag === FEATURE_FLAGS.AI_MATCHING) {
      const hash = hashString(userId);
      return hash % 100 < 50; // 50% rollout
    }

    // Premium features only for premium users
    if (flag === FEATURE_FLAGS.VIDEO_CALLS) {
      // In real app, check user's subscription tier
      return true; // Mock: enabled for all authenticated users
    }

    // Beta features for specific user segments
    if (flag === FEATURE_FLAGS.NEW_ONBOARDING) {
      const hash = hashString(userId);
      return hash % 100 < 10; // 10% beta rollout
    }
  }

  return baseEnabled;
};

// Feature flag component for conditional rendering
// See src/components/ui/feature-flag.tsx for the React component

// Utility function for consistent string hashing
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// Admin interface for runtime feature flag management
export const updateFeatureFlag = async (
  flag: FeatureFlag,
  enabled: boolean,
): Promise<void> => {
  // In production, this would update a database or external service
  console.log(`Feature flag ${flag} ${enabled ? 'enabled' : 'disabled'}`);

  // For demo purposes, update local storage
  const flags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
  flags[flag] = enabled;
  localStorage.setItem('featureFlags', JSON.stringify(flags));
};

// Get runtime-updated feature flags
export const getRuntimeFeatureFlags = (): Partial<
  Record<FeatureFlag, boolean>
> => {
  try {
    return JSON.parse(localStorage.getItem('featureFlags') || '{}');
  } catch {
    return {};
  }
};
