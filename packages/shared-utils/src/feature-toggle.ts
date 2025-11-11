import { OpenFeature } from '@openfeature/js-sdk';
import { InMemoryProvider } from '@openfeature/in-memory-provider';

// Feature flag definitions
export enum FeatureFlags {
  PREMIUM_FEATURES = 'premium-features',
  ADVANCED_SEARCH = 'advanced-search',
  REAL_TIME_MESSAGING = 'real-time-messaging',
  AI_MATCHING = 'ai-matching',
  VIDEO_CALLS = 'video-calls',
  PAYMENT_PROCESSING = 'payment-processing'
}

// Default feature flag values
const defaultFlags = {
  [FeatureFlags.PREMIUM_FEATURES]: false,
  [FeatureFlags.ADVANCED_SEARCH]: true,
  [FeatureFlags.REAL_TIME_MESSAGING]: true,
  [FeatureFlags.AI_MATCHING]: false,
  [FeatureFlags.VIDEO_CALLS]: false,
  [FeatureFlags.PAYMENT_PROCESSING]: true,
};

// Initialize OpenFeature with in-memory provider
const provider = new InMemoryProvider(defaultFlags);
OpenFeature.setProvider(provider);

// Feature toggle service
export class FeatureToggleService {
  private static client = OpenFeature.getClient();

  static async isEnabled(flag: FeatureFlags, defaultValue = false): Promise<boolean> {
    try {
      return await this.client.getBooleanValue(flag, defaultValue);
    } catch (error) {
      console.warn(`Feature flag evaluation failed for ${flag}:`, error);
      return defaultValue;
    }
  }

  static async getStringValue(flag: string, defaultValue = ''): Promise<string> {
    try {
      return await this.client.getStringValue(flag, defaultValue);
    } catch (error) {
      console.warn(`Feature flag evaluation failed for ${flag}:`, error);
      return defaultValue;
    }
  }

  static async getNumberValue(flag: string, defaultValue = 0): Promise<number> {
    try {
      return await this.client.getNumberValue(flag, defaultValue);
    } catch (error) {
      console.warn(`Feature flag evaluation failed for ${flag}:`, error);
      return defaultValue;
    }
  }

  // Update feature flags dynamically
  static updateFlags(newFlags: Partial<Record<FeatureFlags, boolean>>) {
    const updatedFlags = { ...defaultFlags, ...newFlags };
    const newProvider = new InMemoryProvider(updatedFlags);
    OpenFeature.setProvider(newProvider);
    this.client = OpenFeature.getClient();
  }

  // React hook for feature flags
  static useFeatureFlag(flag: FeatureFlags, defaultValue = false) {
    // This would be implemented as a React hook in the frontend
    // For now, return a simple async function
    return () => this.isEnabled(flag, defaultValue);
  }
}

// Middleware for conditional feature access
export const requireFeature = (flag: FeatureFlags) => {
  return async (req: any, res: any, next: any) => {
    const isEnabled = await FeatureToggleService.isEnabled(flag, false);
    if (!isEnabled) {
      return res.status(403).json({
        error: 'Feature not available',
        feature: flag
      });
    }
    next();
  };
};