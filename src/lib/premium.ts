import { TwitchUser } from '@/components/auth/AuthProvider';
import { config } from '@/lib/config';

/**
 * Check if a user has premium status
 * @param user The user object
 * @returns True if the user has premium status, false otherwise
 */
export function isPremium(user: TwitchUser | null): boolean {
  if (!user) return false;
  return !!user.premium_flag;
}

/**
 * Get the maximum number of streams allowed for a user
 * @param user The user object
 * @returns The maximum number of streams allowed
 */
export function getMaxStreams(user: TwitchUser | null): number {
  if (isPremium(user)) {
    return config.features.maxPremiumStreams;
  }
  return config.features.maxFreeStreams;
}

/**
 * Check if a user can add more streams
 * @param user The user object
 * @param currentStreamCount The current number of streams
 * @returns True if the user can add more streams, false otherwise
 */
export function canAddMoreStreams(user: TwitchUser | null, currentStreamCount: number): boolean {
  const maxStreams = getMaxStreams(user);
  return currentStreamCount < maxStreams;
}

/**
 * Get premium features that are available to the user
 * @param user The user object
 * @returns An object with boolean flags for each premium feature
 */
export function getPremiumFeatures(user: TwitchUser | null) {
  const hasPremium = isPremium(user);
  
  return {
    unlimitedStreams: hasPremium,
    vodSync: hasPremium && config.features.enableVodSync,
    notifications: hasPremium && config.features.enableNotifications,
    packSaving: hasPremium,
    packCloning: hasPremium,
  };
}