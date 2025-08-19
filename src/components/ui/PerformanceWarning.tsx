/**
 * Performance Warning Component
 * 
 * This component displays non-intrusive warnings to users when performance issues are detected.
 * It provides actionable suggestions without disrupting the viewing experience.
 */

import React, { useState, useEffect } from 'react';
import analytics, { EventCategory, PerformanceEvents } from '@/lib/analytics';

export type WarningLevel = 'info' | 'warning' | 'error';

export interface PerformanceWarningProps {
  message: string;
  level?: WarningLevel;
  suggestion?: string;
  autoHide?: boolean;
  autoHideDuration?: number;
  onClose?: () => void;
}

const PerformanceWarning: React.FC<PerformanceWarningProps> = ({
  message,
  level = 'warning',
  suggestion,
  autoHide = true,
  autoHideDuration = 8000,
  onClose
}) => {
  const [visible, setVisible] = useState(true);
  
  // Track warning display when component mounts
  useEffect(() => {
    if (visible) {
      analytics.trackEvent(EventCategory.UI, 'warning_shown', {
        warningType: level,
        message,
        suggestion: suggestion || undefined
      });
    }
  }, []);
  
  // Auto-hide the warning after the specified duration
  useEffect(() => {
    if (autoHide && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        
        // Track auto-dismiss
        analytics.trackEvent(EventCategory.UI, 'warning_auto_dismissed', {
          warningType: level,
          message,
          duration: autoHideDuration
        });
        
        if (onClose) onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDuration, visible, onClose, level, message]);
  
  // Handle close button click
  const handleClose = () => {
    setVisible(false);
    
    // Track manual dismiss
    analytics.trackEvent(EventCategory.UI, 'warning_manually_dismissed', {
      warningType: level,
      message,
      suggestion: suggestion || undefined
    });
    
    if (onClose) onClose();
  };
  
  // If not visible, don't render anything
  if (!visible) return null;
  
  // Determine background color based on level
  const bgColor = 
    level === 'error' ? 'bg-red-500/90' :
    level === 'warning' ? 'bg-amber-500/90' :
    'bg-blue-500/90';
  
  // Determine icon based on level
  const icon = 
    level === 'error' ? '⚠️' :
    level === 'warning' ? '⚠️' :
    'ℹ️';
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md rounded-lg shadow-lg ${bgColor} text-white p-4 transition-all duration-300 ease-in-out`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2">
          <span className="text-xl">{icon}</span>
        </div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {suggestion && (
            <p className="mt-1 text-sm text-white/90">{suggestion}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-4 flex-shrink-0 text-white hover:text-white/80 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PerformanceWarning;

// Container component to manage multiple warnings
export const PerformanceWarningContainer: React.FC<{
  children?: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {children}
    </div>
  );
};

// Helper function to detect device capabilities
const detectDeviceCapabilities = (): {
  tier: 'low' | 'medium' | 'high';
  maxRecommendedStreams: number;
  description: string;
} => {
  // Only run in browser
  if (typeof window === 'undefined') {
    return { tier: 'medium', maxRecommendedStreams: 4, description: 'Standard device' };
  }

  // Check for mobile devices first
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check for memory (if available)
  const hasLowMemory = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
  
  // Check for CPU cores (if available)
  const hasLowCPU = 'hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4;
  
  // Check for connection speed (if available)
  const hasSlowConnection = 'connection' in navigator &&
    ['slow-2g', '2g', '3g'].includes((navigator as any).connection?.effectiveType);
  
  // Determine device tier
  if (isMobile || hasLowMemory || hasLowCPU || hasSlowConnection) {
    return {
      tier: 'low',
      maxRecommendedStreams: 2,
      description: isMobile ? 'Mobile device' : 'Low-performance device'
    };
  } else if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency >= 8) {
    return {
      tier: 'high',
      maxRecommendedStreams: 6,
      description: 'High-performance device'
    };
  } else {
    return {
      tier: 'medium',
      maxRecommendedStreams: 4,
      description: 'Standard device'
    };
  }
};

// Helper component for stream-specific warnings
export const StreamPerformanceWarning: React.FC<{
  streamCount: number;
  isPremium: boolean;
}> = ({ streamCount, isPremium }) => {
  // Detect device capabilities
  const [deviceCapabilities] = useState(detectDeviceCapabilities);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Check if notifications are disabled in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const notificationsDisabled = localStorage.getItem('t333_quality_notifications_disabled');
      if (notificationsDisabled === 'true') {
        setNotificationsEnabled(false);
      }
    }
  }, []);
  
  // Function to toggle notifications
  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('t333_quality_notifications_disabled', newValue ? 'false' : 'true');
    
    // Track the toggle action
    analytics.trackEvent(EventCategory.UI, 'performance_notifications_toggled', {
      enabled: newValue
    });
  };
  
  // Determine warning level based on stream count and device capabilities
  const getWarningLevel = (): {
    shouldShow: boolean;
    level: WarningLevel;
    message: string;
    suggestion: string;
  } => {
    // Free user limits
    if (!isPremium) {
      if (streamCount >= 3) {
        return {
          shouldShow: true,
          level: 'info',
          message: `You've reached the maximum of ${streamCount} streams for free users`,
          suggestion: "Upgrade to premium for unlimited streams and enhanced features"
        };
      }
      return { shouldShow: false, level: 'info', message: '', suggestion: '' };
    }
    
    // Premium user warnings based on device capabilities and stream count
    const { maxRecommendedStreams, description, tier } = deviceCapabilities;
    
    // Critical warning - way too many streams for device
    if (streamCount >= maxRecommendedStreams * 2) {
      return {
        shouldShow: true,
        level: 'error',
        message: `Performance will significantly degrade with ${streamCount} streams on your ${description}`,
        suggestion: `We recommend a maximum of ${maxRecommendedStreams} streams for optimal performance on your device`
      };
    }
    
    // Warning - approaching device limits
    if (streamCount >= maxRecommendedStreams * 1.5) {
      return {
        shouldShow: true,
        level: 'warning',
        message: `Performance may degrade with ${streamCount} streams on your ${description}`,
        suggestion: `Consider closing streams you're not actively watching or reducing stream quality`
      };
    }
    
    // Caution - getting close to limits
    if (streamCount >= maxRecommendedStreams) {
      return {
        shouldShow: true,
        level: 'info',
        message: `You're approaching the recommended limit for your ${description}`,
        suggestion: tier === 'low' ?
          "Consider using our mobile-optimized view for better performance" :
          "For best performance, keep the most important streams in view"
      };
    }
    
    // No warning needed
    return { shouldShow: false, level: 'info', message: '', suggestion: '' };
  };
  
  const { shouldShow, level, message, suggestion } = getWarningLevel();
  
  // Track stream count warning event when the component renders with a warning
  useEffect(() => {
    if (shouldShow) {
      analytics.trackPerformanceEvent(
        isPremium ? PerformanceEvents.HIGH_MEMORY : 'free_tier_limit',
        {
          streamCount,
          isPremium,
          deviceTier: deviceCapabilities.tier,
          maxRecommendedStreams: deviceCapabilities.maxRecommendedStreams,
          warningLevel: level,
          warningType: isPremium ? 'performance' : 'upgrade'
        }
      );
    }
  }, [shouldShow, streamCount, isPremium, level, deviceCapabilities, notificationsEnabled]);
  
  if (!shouldShow || !notificationsEnabled) {
    // If we shouldn't show the warning or notifications are disabled, check if we need to show the re-enable button
    if (!notificationsEnabled && shouldShow) {
      return (
        <div className="fixed bottom-24 right-6 z-10">
          <button
            onClick={toggleNotifications}
            className="bg-blue-500/90 text-white p-2 rounded-full shadow-lg hover:bg-blue-600/90 transition-colors flex items-center gap-2"
            title="Enable performance notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Show performance warnings</span>
          </button>
        </div>
      );
    }
    return null;
  }
  
  return (
    <div className="relative">
      <PerformanceWarning
        message={message}
        suggestion={suggestion}
        level={level}
        autoHideDuration={level === 'error' ? 15000 : 8000} // Keep error messages visible longer
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleNotifications();
        }}
        className="absolute top-2 right-12 text-white/80 hover:text-white p-1 rounded-full hover:bg-black/20 transition-colors"
        title="Disable performance notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
  );
};