/**
 * Sharing Tracking Hook
 * 
 * This hook provides utilities for tracking social sharing events throughout the application.
 * It wraps the analytics utility to provide a simpler API for tracking sharing events.
 */

import { useCallback } from 'react';
import analytics, { EventCategory, SocialEvents } from '@/lib/analytics';
import { useAuth } from '@/components/auth/AuthProvider';

export type SharingMethod = 'copy_link' | 'twitter' | 'facebook' | 'discord' | 'email' | 'other';

export function useSharingTracking() {
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Track content sharing
   * 
   * @param contentType The type of content being shared (e.g., 'pack', 'stream')
   * @param contentId The ID of the content being shared
   * @param method The method used to share the content
   * @param properties Additional properties to include with the event
   */
  const trackShare = useCallback((
    contentType: string,
    contentId: string,
    method: SharingMethod,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SOCIAL, SocialEvents.SHARE_CONTENT, {
      contentType,
      contentId,
      method,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track link copying
   * 
   * @param contentType The type of content being copied (e.g., 'pack', 'stream')
   * @param contentId The ID of the content being copied
   * @param properties Additional properties to include with the event
   */
  const trackCopyLink = useCallback((
    contentType: string,
    contentId: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SOCIAL, SocialEvents.COPY_LINK, {
      contentType,
      contentId,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track social media sharing
   * 
   * @param contentType The type of content being shared (e.g., 'pack', 'stream')
   * @param contentId The ID of the content being shared
   * @param platform The social media platform used for sharing
   * @param properties Additional properties to include with the event
   */
  const trackSocialShare = useCallback((
    contentType: string,
    contentId: string,
    platform: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SOCIAL, SocialEvents.SOCIAL_SHARE, {
      contentType,
      contentId,
      platform,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  return {
    trackShare,
    trackCopyLink,
    trackSocialShare
  };
}

export default useSharingTracking;