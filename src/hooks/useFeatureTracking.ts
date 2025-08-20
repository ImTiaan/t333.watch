/**
 * Feature Tracking Hook
 * 
 * This hook provides utilities for tracking feature usage throughout the application.
 * It wraps the analytics utility to provide a simpler API for tracking feature usage.
 */

import { useCallback } from 'react';
import analytics, { EventCategory, FeatureEvents } from '@/lib/analytics';
import { useAuth } from '@/components/auth/AuthProvider';

export function useFeatureTracking() {
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Track feature usage
   * 
   * @param featureName The name of the feature being used
   * @param properties Additional properties to include with the event
   */
  const trackFeatureUsage = useCallback((
    featureName: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.FEATURE, FeatureEvents.FEATURE_USAGE, {
      feature: featureName,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track premium feature usage
   * 
   * @param featureName The name of the premium feature being used
   * @param properties Additional properties to include with the event
   */
  const trackPremiumFeatureUsage = useCallback((
    featureName: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.FEATURE, FeatureEvents.PREMIUM_FEATURE_USAGE, {
      feature: featureName,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track premium feature prompt
   * 
   * @param featureName The name of the premium feature being prompted
   * @param properties Additional properties to include with the event
   */
  const trackPremiumFeaturePrompt = useCallback((
    featureName: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.FEATURE, FeatureEvents.PREMIUM_FEATURE_PROMPT, {
      feature: featureName,
      userId: user?.id,
      username: user?.display_name,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track feature discovery
   * 
   * @param featureName The name of the feature being discovered
   * @param properties Additional properties to include with the event
   */
  const trackFeatureDiscovery = useCallback((
    featureName: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.FEATURE, FeatureEvents.FEATURE_DISCOVERY, {
      feature: featureName,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  return {
    trackFeatureUsage,
    trackPremiumFeatureUsage,
    trackPremiumFeaturePrompt,
    trackFeatureDiscovery
  };
}

export default useFeatureTracking;