/**
 * Dating App Configuration
 * Defines all kinks, preferences, user modes, and feature gates
 */

export const DATING_APP_CONFIG = {
  // User Modes
  userModes: {
    LOOKING_FOR_BOYFRIEND: {
      id: 'looking_for_boyfriend',
      label: 'Looking for a Boyfriend',
      description: 'Browse and connect with potential boyfriends',
      icon: 'search',
      features: ['browse', 'swipe', 'message', 'book'],
    },
    BECOME_BOYFRIEND: {
      id: 'become_boyfriend',
      label: 'Become a Boyfriend',
      description: 'Offer companionship and dating services',
      icon: 'heart',
      features: ['profile', 'availability', 'bookings', 'earnings'],
      requiresVerification: true,
    },
  },

  // Body Types / Tribes
  bodyTypes: [
    { id: 'twink', label: 'Twink', description: 'Slim, youthful, often smooth' },
    { id: 'otter', label: 'Otter', description: 'Slim to average, hairy' },
    { id: 'bear', label: 'Bear', description: 'Larger, hairy, masculine' },
    { id: 'cub', label: 'Cub', description: 'Younger bear, stocky' },
    { id: 'jock', label: 'Jock', description: 'Athletic, muscular' },
    { id: 'daddy', label: 'Daddy', description: 'Older, masculine, mature' },
    { id: 'wolf', label: 'Wolf', description: 'Hairy, lean, rugged' },
    { id: 'pup', label: 'Pup', description: 'Youthful, energetic, playful' },
    { id: 'muscle', label: 'Muscle', description: 'Very muscular, bodybuilder' },
    { id: 'average', label: 'Average', description: 'Average build' },
    { id: 'slim', label: 'Slim', description: 'Slim build' },
    { id: 'stocky', label: 'Stocky', description: 'Stocky, solid build' },
  ],

  // Sexual Preferences / Kinks
  kinks: {
    // Intensity/Style
    intensity: [
      { id: 'passionate', label: 'Passionate', description: 'Romantic and intimate' },
      { id: 'rough', label: 'Rough', description: 'Intense and physical' },
      { id: 'gentle', label: 'Gentle', description: 'Soft and tender' },
      { id: 'kinky', label: 'Kinky', description: 'Experimental and adventurous' },
      { id: 'vanilla', label: 'Vanilla', description: 'Traditional and sweet' },
    ],

    // Activities (keeping it tasteful)
    activities: [
      { id: 'ff', label: 'FF', description: 'Fist friendly' },
      { id: 'bd', label: 'BD', description: 'Bondage & discipline' },
      { id: 'ds', label: 'DS', description: 'Dominance & submission' },
      { id: 'roleplay', label: 'Role Play', description: 'Fantasy scenarios' },
      { id: 'toys', label: 'Toys', description: 'Adult toys' },
      { id: 'group', label: 'Group', description: 'Multiple partners' },
      { id: 'outdoor', label: 'Outdoor', description: 'Public/outdoor settings' },
      { id: 'verbal', label: 'Verbal', description: 'Dirty talk' },
    ],

    // Positions
    positions: [
      { id: 'top', label: 'Top', description: 'Dominant/active' },
      { id: 'bottom', label: 'Bottom', description: 'Submissive/receptive' },
      { id: 'versatile', label: 'Versatile', description: 'Either role' },
      { id: 'vers_top', label: 'Vers Top', description: 'Prefer top but versatile' },
      { id: 'vers_bottom', label: 'Vers Bottom', description: 'Prefer bottom but versatile' },
      { id: 'side', label: 'Side', description: 'Prefer other activities' },
    ],

    // Safety & Health
    safety: [
      { id: 'prep', label: 'PrEP', description: 'On PrEP' },
      { id: 'condoms_always', label: 'Condoms Always', description: 'Always use protection' },
      { id: 'tested_regular', label: 'Tested Regularly', description: 'Regular STI testing' },
      { id: 'neg', label: 'HIV-', description: 'HIV negative' },
      { id: 'undetectable', label: 'Undetectable', description: 'Undetectable viral load' },
      { id: 'poz', label: 'HIV+', description: 'HIV positive' },
    ],
  },

  // Relationship Goals
  relationshipGoals: [
    { id: 'chat', label: 'Chat', description: 'Just talking' },
    { id: 'friends', label: 'Friends', description: 'Friendship' },
    { id: 'dates', label: 'Dates', description: 'Dating' },
    { id: 'relationship', label: 'Relationship', description: 'Long-term relationship' },
    { id: 'right_now', label: 'Right Now', description: 'Immediate meetup' },
    { id: 'networking', label: 'Networking', description: 'Professional/social networking' },
  ],

  // Free vs Premium Features
  features: {
    free: {
      swipesPerDay: 5,
      photosVisible: 1, // Only first photo visible, rest blurred
      canMessage: false,
      canSeeWhoLiked: false,
      canUseFilters: false,
      canSeeOnlineStatus: false,
      canViewGridMode: false,
      canAccessHiddenAlbums: false,
      canBook: false,
      adFree: false,
    },
    premium: {
      swipesPerDay: -1, // Unlimited
      photosVisible: -1, // All photos visible
      canMessage: true,
      canSeeWhoLiked: true,
      canUseFilters: true,
      canSeeOnlineStatus: true,
      canViewGridMode: true,
      canAccessHiddenAlbums: true,
      canBook: true,
      adFree: true,
      prioritySupport: true,
      verifiedBadge: true,
      incognitoMode: true,
      unlimitedRewinds: true,
    },
  },

  // Pricing Tiers
  pricing: {
    monthly: {
      price: 19.99,
      currency: 'USD',
      interval: 'month',
    },
    quarterly: {
      price: 49.99,
      currency: 'USD',
      interval: '3 months',
      savings: '17%',
    },
    yearly: {
      price: 149.99,
      currency: 'USD',
      interval: 'year',
      savings: '37%',
    },
  },

  // Abuse & Safety
  reportReasons: [
    { id: 'fake_profile', label: 'Fake Profile', severity: 'medium' },
    { id: 'inappropriate_photos', label: 'Inappropriate Photos', severity: 'high' },
    { id: 'harassment', label: 'Harassment', severity: 'high' },
    { id: 'spam', label: 'Spam', severity: 'low' },
    { id: 'underage', label: 'Underage User', severity: 'critical' },
    { id: 'hate_speech', label: 'Hate Speech', severity: 'critical' },
    { id: 'violence_threats', label: 'Violence or Threats', severity: 'critical' },
    { id: 'scam', label: 'Scam or Fraud', severity: 'high' },
    { id: 'no_show', label: 'No Show (Booking)', severity: 'medium' },
    { id: 'inappropriate_behavior', label: 'Inappropriate Behavior', severity: 'high' },
  ],

  // Ban Durations (in days)
  banDurations: {
    warning: 0, // Just a warning
    minor: 1, // 1 day
    moderate: 7, // 1 week
    severe: 30, // 1 month
    critical: 365, // 1 year
    permanent: -1, // Permanent ban
  },

  // Age Verification
  ageVerification: {
    minimumAge: 18,
    requiresIDVerification: true,
    requiresPhotoVerification: true,
  },

  // GDPR & Privacy
  gdpr: {
    dataRetentionDays: 90,
    allowDataExport: true,
    allowDataDeletion: true,
    requiresConsentForMarketing: true,
    requiresConsentForAnalytics: true,
    cookieConsentRequired: true,
  },

  // Terms & Conditions
  legal: {
    termsVersion: '1.0.0',
    privacyVersion: '1.0.0',
    lastUpdated: '2025-11-12',
    requireAcceptance: true,
    minimumAge: 18,
    geographicRestrictions: [], // Can add country codes if needed
  },
} as const;

export type UserMode = keyof typeof DATING_APP_CONFIG.userModes;
export type BodyType = typeof DATING_APP_CONFIG.bodyTypes[number]['id'];
export type KinkIntensity = typeof DATING_APP_CONFIG.kinks.intensity[number]['id'];
export type KinkActivity = typeof DATING_APP_CONFIG.kinks.activities[number]['id'];
export type Position = typeof DATING_APP_CONFIG.kinks.positions[number]['id'];
export type SafetyPreference = typeof DATING_APP_CONFIG.kinks.safety[number]['id'];
export type RelationshipGoal = typeof DATING_APP_CONFIG.relationshipGoals[number]['id'];
export type ReportReason = typeof DATING_APP_CONFIG.reportReasons[number]['id'];
