/**
 * 🎛️ Feature Flag React Component
 * Conditional rendering based on feature flags
 */

import React from 'react';
import { FeatureFlag as FeatureFlagType, useFeatureFlag } from '@/lib/featureFlags';

interface FeatureFlagProps {
  flag: FeatureFlagType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  flag,
  children,
  fallback = null
}) => {
  const enabled = useFeatureFlag(flag);
  return enabled ? <>{children}</> : <>{fallback}</>;
};