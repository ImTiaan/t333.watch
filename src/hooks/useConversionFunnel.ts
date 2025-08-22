/**
 * Conversion Funnel Tracking Hook
 * 
 * This hook provides utilities for tracking user journey through the subscription conversion funnel.
 * It integrates with both the analytics system and the database for comprehensive tracking.
 */

import { useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import analytics, { EventCategory } from '@/lib/analytics';
import {
  trackLandingPage,
  trackViewPricing,
  trackFunnelCheckoutStart,
  trackPaymentInfo,
  trackCompletePurchase,
  trackAbandonedCheckout,
  getFunnelAnalytics,
  getSessionJourney,
  clearSessionId
} from '@/lib/conversion-funnel';

export function useConversionFunnel() {
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Track landing page visit
   */
  const trackLanding = useCallback(async (properties?: Record<string, any>) => {
    // Track in analytics system
    analytics.trackEvent(EventCategory.NAVIGATION, 'landing_page_visit', {
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
    
    // Save to database for funnel analytics
    try {
      await trackLandingPage(user?.id, {
        username: user?.display_name,
        isPremium: user?.premium_flag || false,
        isAuthenticated,
        ...properties
      });
    } catch (error) {
      console.error('Failed to save landing page event:', error);
    }
  }, [user, isAuthenticated]);
  
  /**
   * Track pricing page view
   */
  const trackPricing = useCallback(async (properties?: Record<string, any>) => {
    // Track in analytics system
    analytics.trackEvent(EventCategory.SUBSCRIPTION, 'view_pricing_page', {
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
    
    // Save to database for funnel analytics
    try {
      await trackViewPricing(user?.id, {
        username: user?.display_name,
        isPremium: user?.premium_flag || false,
        isAuthenticated,
        ...properties
      });
    } catch (error) {
      console.error('Failed to save pricing view event:', error);
    }
  }, [user, isAuthenticated]);
  
  /**
   * Track checkout initiation
   */
  const trackCheckoutStart = useCallback(async (
    planId: string,
    planName: string,
    price: number,
    properties?: Record<string, any>
  ) => {
    // Track in analytics system
    analytics.trackEvent(EventCategory.SUBSCRIPTION, 'funnel_checkout_start', {
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
    
    // Save to database for funnel analytics
    if (user?.id) {
      try {
        await trackFunnelCheckoutStart(user.id, planId, planName, {
          price,
          username: user.display_name,
          isPremium: user.premium_flag || false,
          ...properties
        });
      } catch (error) {
        console.error('Failed to save checkout start event:', error);
      }
    }
  }, [user, isAuthenticated]);
  
  /**
   * Track payment information entry
   */
  const trackPaymentEntry = useCallback(async (
    planId: string,
    properties?: Record<string, any>
  ) => {
    // Track in analytics system
    analytics.trackEvent(EventCategory.SUBSCRIPTION, 'payment_info_entered', {
      planId,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
    
    // Save to database for funnel analytics
    if (user?.id) {
      try {
        await trackPaymentInfo(user.id, planId, {
          username: user.display_name,
          isPremium: user.premium_flag || false,
          ...properties
        });
      } catch (error) {
        console.error('Failed to save payment info event:', error);
      }
    }
  }, [user, isAuthenticated]);
  
  /**
   * Track purchase completion
   */
  const trackPurchaseComplete = useCallback(async (
    planId: string,
    planName: string,
    amount: number,
    properties?: Record<string, any>
  ) => {
    // Track in analytics system
    analytics.trackEvent(EventCategory.SUBSCRIPTION, 'purchase_completed', {
      planId,
      planName,
      amount,
      userId: user?.id,
      username: user?.display_name,
      isPremium: true, // They just completed purchase
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
    
    // Save to database for funnel analytics
    if (user?.id) {
      try {
        await trackCompletePurchase(user.id, planId, planName, amount, {
          username: user.display_name,
          ...properties
        });
      } catch (error) {
        console.error('Failed to save purchase complete event:', error);
      }
    }
  }, [user, isAuthenticated]);
  
  /**
   * Track checkout abandonment
   */
  const trackCheckoutAbandonment = useCallback(async (
    planId?: string,
    step?: string,
    properties?: Record<string, any>
  ) => {
    // Track in analytics system
    analytics.trackEvent(EventCategory.SUBSCRIPTION, 'checkout_abandoned', {
      planId,
      abandonmentStep: step,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
    
    // Save to database for funnel analytics
    try {
      await trackAbandonedCheckout(user?.id, planId, step, {
        username: user?.display_name,
        isPremium: user?.premium_flag || false,
        isAuthenticated,
        ...properties
      });
    } catch (error) {
      console.error('Failed to save checkout abandonment event:', error);
    }
  }, [user, isAuthenticated]);
  
  /**
   * Track page exit (for detecting potential abandonment)
   */
  const trackPageExit = useCallback(async (
    currentPage: string,
    properties?: Record<string, any>
  ) => {
    // Only track abandonment if user was in checkout flow
    const checkoutPages = ['/premium', '/checkout', '/payment'];
    const isCheckoutPage = checkoutPages.some(page => currentPage.includes(page));
    
    if (isCheckoutPage) {
      await trackCheckoutAbandonment(
        properties?.planId,
        currentPage,
        {
          exitType: 'page_navigation',
          ...properties
        }
      );
    }
  }, [trackCheckoutAbandonment]);
  
  /**
   * Get funnel analytics data
   */
  const getFunnelData = useCallback(async (
    startDate: string,
    endDate: string
  ) => {
    try {
      return await getFunnelAnalytics(startDate, endDate);
    } catch (error) {
      console.error('Failed to get funnel analytics:', error);
      return null;
    }
  }, []);
  
  /**
   * Get session journey data
   */
  const getSessionData = useCallback(async (sessionId: string) => {
    try {
      return await getSessionJourney(sessionId);
    } catch (error) {
      console.error('Failed to get session journey:', error);
      return null;
    }
  }, []);
  
  /**
   * Reset session tracking
   */
  const resetSession = useCallback(() => {
    clearSessionId();
  }, []);
  
  return {
    // Tracking functions
    trackLanding,
    trackPricing,
    trackCheckoutStart,
    trackPaymentEntry,
    trackPurchaseComplete,
    trackCheckoutAbandonment,
    trackPageExit,
    
    // Analytics functions
    getFunnelData,
    getSessionData,
    resetSession
  };
}