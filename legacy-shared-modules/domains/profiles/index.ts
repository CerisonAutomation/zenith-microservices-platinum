/**
 * 👤 Profiles Domain
 * Business logic for user profiles, matching, and preferences
 */

import type { Profile } from '@/types';
import { profilesApi } from '@/lib/api';
import {
  supabaseCircuitBreaker,
  withCircuitBreaker,
} from '@/lib/circuitBreaker';

export class ProfileDomain {
  /**
   * Get user profile with circuit breaker protection
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    const result = await withCircuitBreaker(
      supabaseCircuitBreaker,
      () => profilesApi.getProfile(userId),
      () => null, // Fallback: return null on failure
    );
    return result ?? null;
  }

  /**
   * Update user profile with validation
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Profile>,
  ): Promise<Profile> {
    // Validate updates
    this.validateProfileUpdates(updates);

    const result = await withCircuitBreaker(supabaseCircuitBreaker, () =>
      profilesApi.updateProfile(userId, updates),
    );
    return result!;
  }

  /**
   * Get compatible profiles for matching
   */
  static async getCompatibleProfiles(
    userId: string,
    preferences: Profile['preferences'],
  ): Promise<Profile[]> {
    const profiles = await withCircuitBreaker(
      supabaseCircuitBreaker,
      () => profilesApi.getProfiles(),
      () => [], // Fallback: empty array
    );

    // Filter and score compatibility
    return profiles
      .filter((profile) => profile.id !== userId)
      .map((profile) => ({
        ...profile,
        compatibilityScore: this.calculateCompatibilityScore(
          profile,
          preferences,
        ),
      }))
      .sort(
        (a, b) => (b as any).compatibilityScore - (a as any).compatibilityScore,
      );
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(
    userId: string,
    profileId: string,
  ): Promise<boolean> {
    return withCircuitBreaker(supabaseCircuitBreaker, () =>
      profilesApi.toggleFavorite(userId, profileId),
    );
  }

  /**
   * Get user's favorites
   */
  static async getFavorites(userId: string): Promise<Profile[]> {
    return withCircuitBreaker(
      supabaseCircuitBreaker,
      () => profilesApi.getFavorites(userId),
      () => [], // Fallback: empty array
    );
  }

  /**
   * Validate profile updates
   */
  private static validateProfileUpdates(updates: Partial<Profile>): void {
    if (updates.age && (updates.age < 18 || updates.age > 100)) {
      throw new Error('Age must be between 18 and 100');
    }

    if (updates.bio && updates.bio.length > 500) {
      throw new Error('Bio must be less than 500 characters');
    }

    if (updates.preferences?.kinks) {
      const validKinks = [
        'BDSM',
        'roleplay',
        'sensory play',
        'vanilla',
        'romantic',
        'sensual',
        'experimental',
      ];
      const invalidKinks = updates.preferences.kinks.filter(
        (kink) => !validKinks.includes(kink),
      );
      if (invalidKinks.length > 0) {
        throw new Error(`Invalid kinks: ${invalidKinks.join(', ')}`);
      }
    }

    if (updates.preferences?.roles) {
      const validRoles = [
        'switch',
        'dominant',
        'submissive',
        'pleaser',
        'explorer',
        'curious',
      ];
      const invalidRoles = updates.preferences.roles.filter(
        (role) => !validRoles.includes(role),
      );
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
      }
    }
  }

  /**
   * Calculate compatibility score between profiles
   */
  private static calculateCompatibilityScore(
    profile: Profile,
    userPreferences?: Profile['preferences'],
  ): number {
    if (!userPreferences) return 0;

    let score = 0;
    const maxScore = 100;

    // Age compatibility
    if (
      profile.age >= userPreferences.ageRange[0] &&
      profile.age <= userPreferences.ageRange[1]
    ) {
      score += 20;
    }

    // Distance compatibility
    if (profile.distance) {
      const distanceKm = parseFloat(profile.distance.replace(' km', ''));
      if (distanceKm <= userPreferences.distance) {
        score += 15;
      }
    }

    // Kinks compatibility
    if (profile.preferences?.kinks && userPreferences.kinks) {
      const commonKinks = profile.preferences.kinks.filter((kink) =>
        userPreferences.kinks!.includes(kink),
      );
      score +=
        (commonKinks.length /
          Math.max(
            profile.preferences.kinks.length,
            userPreferences.kinks.length,
          )) *
        25;
    }

    // Roles compatibility
    if (profile.preferences?.roles && userPreferences.roles) {
      const commonRoles = profile.preferences.roles.filter((role) =>
        userPreferences.roles!.includes(role),
      );
      score +=
        (commonRoles.length /
          Math.max(
            profile.preferences.roles.length,
            userPreferences.roles.length,
          )) *
        20;
    }

    // Tribes/interests compatibility
    if (profile.preferences?.tribes && userPreferences.tribes) {
      const commonTribes = profile.preferences.tribes.filter((tribe) =>
        userPreferences.tribes!.includes(tribe),
      );
      score +=
        (commonTribes.length /
          Math.max(
            profile.preferences.tribes.length,
            userPreferences.tribes.length,
          )) *
        20;
    }

    return Math.min(score, maxScore);
  }
}

// Domain events
export const PROFILE_EVENTS = {
  PROFILE_UPDATED: 'profile.updated',
  MATCH_FOUND: 'profile.match.found',
  FAVORITE_ADDED: 'profile.favorite.added',
  FAVORITE_REMOVED: 'profile.favorite.removed',
} as const;

export type ProfileEvent = (typeof PROFILE_EVENTS)[keyof typeof PROFILE_EVENTS];
