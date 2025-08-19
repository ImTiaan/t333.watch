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

// Helper component for stream-specific warnings
export const StreamPerformanceWarning: React.FC<{
  streamCount: number;
  isPremium: boolean;
}> = ({ streamCount, isPremium }) => {
  // Only show warnings for non-premium users with 3 streams
  // or premium users with 6+ streams
  const shouldShowWarning =
    (!isPremium && streamCount >= 3) ||
    (isPremium && streamCount >= 6);
  
  // Track stream count warning event when the component renders with a warning
  useEffect(() => {
    if (shouldShowWarning) {
      analytics.trackPerformanceEvent(
        isPremium ? PerformanceEvents.HIGH_MEMORY : 'free_tier_limit',
        {
          streamCount,
          isPremium,
          warningType: isPremium ? 'performance' : 'upgrade'
        }
      );
    }
  }, [shouldShowWarning, streamCount, isPremium]);
  
  if (!shouldShowWarning) return null;
  
  const message = isPremium
    ? `Performance may degrade with ${streamCount} streams open`
    : `You've reached the maximum of ${streamCount} streams for free users`;
  
  const suggestion = isPremium
    ? "Consider closing streams you're not actively watching"
    : "Upgrade to premium for unlimited streams";
  
  return (
    <PerformanceWarning
      message={message}
      suggestion={suggestion}
      level={isPremium ? 'warning' : 'info'}
    />
  );
};