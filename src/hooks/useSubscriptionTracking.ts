/**
 * Subscription Tracking Hook
 * 
 * This hook provides utilities for tracking subscription and payment events.
 * It wraps the analytics utility to provide a simpler API for tracking subscription-related events.
 */

import { useCallback } from 'react';
import analytics, { EventCategory, SubscriptionEvents } from '@/lib/analytics';
import { useAuth } from '@/components/auth/AuthProvider';

export function useSubscriptionTracking() {
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Track when a user views subscription plans
   * 
   * @param properties Additional properties to include with the event
   */
  const trackViewPlans = useCallback((properties?: Record<string, unknown>) => {
    analytics.trackEvent(EventCategory.SUBSCRIPTION, SubscriptionEvents.VIEW_PLANS, {
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user starts the checkout process
   * 
   * @param planId The ID of the plan being purchased
   * @param planName The name of the plan being purchased
   * @param price The price of the plan
   * @param properties Additional properties to include with the event
   */
  const trackStartCheckout = useCallback((
    planId: string,
    planName: string,
    price: number,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SUBSCRIPTION, SubscriptionEvents.START_CHECKOUT, {
      planId,
      planName,
      price,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user completes the checkout process
   * 
   * @param planId The ID of the plan purchased
   * @param planName The name of the plan purchased
   * @param price The price of the plan
   * @param properties Additional properties to include with the event
   */
  const trackCompleteCheckout = useCallback((
    planId: string,
    planName: string,
    price: number,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SUBSCRIPTION, SubscriptionEvents.COMPLETE_CHECKOUT, {
      planId,
      planName,
      price,
      userId: user?.id,
      username: user?.display_name,
      isPremium: true, // They just completed checkout, so they're premium now
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user cancels their subscription
   * 
   * @param reason The reason for cancellation (if provided)
   * @param properties Additional properties to include with the event
   */
  const trackCancelSubscription = useCallback((
    reason?: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SUBSCRIPTION, SubscriptionEvents.CANCEL_SUBSCRIPTION, {
      reason,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user upgrades their subscription
   * 
   * @param fromPlanId The ID of the previous plan
   * @param toPlanId The ID of the new plan
   * @param properties Additional properties to include with the event
   */
  const trackUpgradeSubscription = useCallback((
    fromPlanId: string,
    toPlanId: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SUBSCRIPTION, SubscriptionEvents.UPGRADE_SUBSCRIPTION, {
      fromPlanId,
      toPlanId,
      userId: user?.id,
      username: user?.display_name,
      isPremium: true, // They're upgrading, so they're premium
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track payment errors
   * 
   * @param errorCode The error code from the payment provider
   * @param errorMessage The error message
   * @param properties Additional properties to include with the event
   */
  const trackPaymentError = useCallback((
    errorCode: string,
    errorMessage: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.SUBSCRIPTION, SubscriptionEvents.PAYMENT_ERROR, {
      errorCode,
      errorMessage,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  return {
    trackViewPlans,
    trackStartCheckout,
    trackCompleteCheckout,
    trackCancelSubscription,
    trackUpgradeSubscription,
    trackPaymentError
  };
}

export default useSubscriptionTracking;