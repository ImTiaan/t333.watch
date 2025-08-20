'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import analytics from '@/lib/analytics';

interface PremiumFeatures {
  maxStreams: number;
  unlimitedPacks: boolean;
  customLayouts: boolean;
  streamPinning: boolean;
  layoutSaving: boolean;
}

interface PremiumVerificationResult {
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  features: PremiumFeatures;
  refreshStatus: () => Promise<void>;
  verifyFeatureAccess: (feature: string, currentUsage: number) => Promise<{ allowed: boolean; error?: string }>;
}

const defaultFeatures: PremiumFeatures = {
  maxStreams: 3,
  unlimitedPacks: false,
  customLayouts: false,
  streamPinning: false,
  layoutSaving: false
};

const premiumFeatures: PremiumFeatures = {
  maxStreams: 9,
  unlimitedPacks: true,
  customLayouts: true,
  streamPinning: true,
  layoutSaving: true
};

/**
 * Hook for premium status verification and feature access
 * Provides real-time premium status checking with caching
 */
export function usePremiumVerification(): PremiumVerificationResult {
  const { user, isAuthenticated, getAccessToken } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<PremiumFeatures>(defaultFeatures);

  // Verify premium status from server
  const verifyPremiumStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsPremium(false);
      setFeatures(defaultFeatures);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/premium/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setIsPremium(data.isPremium);
        setFeatures(data.isPremium ? premiumFeatures : defaultFeatures);
        
        // Track verification success
        analytics.trackFeatureUsage('premium_verification_success', {
          userId: user.id,
          isPremium: data.isPremium,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(data.error || 'Failed to verify premium status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsPremium(false);
      setFeatures(defaultFeatures);
      
      // Track verification error
      analytics.trackError('premium_verification_error', errorMessage, {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      console.error('Premium verification error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getAccessToken]);

  // Refresh premium status (force server check)
  const refreshStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/premium/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsPremium(data.isPremium);
          setFeatures(data.isPremium ? premiumFeatures : defaultFeatures);
        }
      }
    } catch (err) {
      console.error('Error refreshing premium status:', err);
    }
  }, [isAuthenticated, user, getAccessToken]);

  // Verify feature access with usage limits
  const verifyFeatureAccess = useCallback(async (feature: string, currentUsage: number): Promise<{ allowed: boolean; error?: string }> => {
    if (!isAuthenticated || !user) {
      return { allowed: false, error: 'Authentication required' };
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        return { allowed: false, error: 'No access token available' };
      }

      const response = await fetch('/api/premium/features/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feature, currentUsage })
      });

      const data = await response.json();
      
      if (response.ok) {
        return { allowed: data.allowed };
      } else {
        return { allowed: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { allowed: false, error: errorMessage };
    }
  }, [isAuthenticated, user, getAccessToken]);

  // Verify premium status on mount and when user changes
  useEffect(() => {
    verifyPremiumStatus();
  }, [verifyPremiumStatus]);

  // Periodic subscription status checking
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Check every 5 minutes (300000ms) for subscription changes
    const SUBSCRIPTION_CHECK_INTERVAL = 5 * 60 * 1000;
    
    const intervalId = setInterval(() => {
      // Only check if user is still authenticated and active
      if (document.visibilityState === 'visible' && isAuthenticated && user) {
        refreshStatus();
        
        // Track periodic check
        analytics.trackFeatureUsage('premium_periodic_check', {
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      }
    }, SUBSCRIPTION_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user, refreshStatus]);

  // Listen for premium status changes via custom events
  useEffect(() => {
    const handlePremiumStatusChange = () => {
      refreshStatus();
    };

    window.addEventListener('premium-status-changed', handlePremiumStatusChange);
    
    return () => {
      window.removeEventListener('premium-status-changed', handlePremiumStatusChange);
    };
  }, [refreshStatus]);

  // Listen for visibility changes to check status when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user) {
        // Check status when user returns to the tab after being away
        refreshStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user, refreshStatus]);

  return {
    isPremium,
    isLoading,
    error,
    features,
    refreshStatus,
    verifyFeatureAccess
  };
}

/**
 * Utility function to trigger premium status refresh across the app
 */
export function triggerPremiumStatusRefresh() {
  window.dispatchEvent(new CustomEvent('premium-status-changed'));
}

/**
 * Hook for checking if a specific premium feature is available
 */
export function usePremiumFeature(featureName: keyof PremiumFeatures) {
  const { isPremium, features, isLoading } = usePremiumVerification();
  
  return {
    isAvailable: isPremium && features[featureName],
    isPremium,
    isLoading,
    feature: features[featureName]
  };
}

/**
 * Hook for premium feature usage tracking
 */
export function usePremiumFeatureTracking() {
  const { user } = useAuth();
  
  const trackFeatureUsage = useCallback((featureName: string, properties?: Record<string, any>) => {
    analytics.trackFeatureUsage(`premium_feature_${featureName}`, {
      userId: user?.id,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user]);
  
  const trackFeatureBlocked = useCallback((featureName: string, reason: string) => {
    analytics.trackFeatureUsage('premium_feature_blocked', {
      userId: user?.id,
      featureName,
      reason,
      timestamp: new Date().toISOString()
    });
  }, [user]);
  
  return {
    trackFeatureUsage,
    trackFeatureBlocked
  };
}