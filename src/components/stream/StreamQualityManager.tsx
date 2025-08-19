/**
 * Stream Quality Manager Component
 * 
 * This component monitors performance metrics and automatically adjusts
 * stream quality settings based on device capabilities and stream count.
 * It implements progressive quality degradation as stream count increases.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import performanceMonitor from '@/lib/performance';
import analytics, { EventCategory, PerformanceEvents } from '@/lib/analytics';
import PerformanceWarning from '@/components/ui/PerformanceWarning';

// Quality levels from highest to lowest
export type StreamQuality = 'source' | 'auto' | 'high' | 'medium' | 'low' | 'audio_only';

interface StreamQualityManagerProps {
  streamCount: number;
  onQualityChange?: (quality: StreamQuality) => void;
  children?: React.ReactNode;
}

// Device capability tiers
type DeviceTier = 'low' | 'medium' | 'high';

// Helper function to detect device capabilities
const detectDeviceCapabilities = (): {
  tier: DeviceTier;
  maxRecommendedStreams: number;
} => {
  // Only run in browser
  if (typeof window === 'undefined') {
    return { tier: 'medium', maxRecommendedStreams: 4 };
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
    return { tier: 'low', maxRecommendedStreams: 2 };
  } else if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency >= 8) {
    return { tier: 'high', maxRecommendedStreams: 6 };
  } else {
    return { tier: 'medium', maxRecommendedStreams: 4 };
  }
};

// Quality recommendation based on device tier and stream count
const getRecommendedQuality = (
  deviceTier: DeviceTier,
  streamCount: number,
  isPrimary: boolean,
  isPremium: boolean
): StreamQuality => {
  // For premium users, maintain higher quality
  const premiumBoost = isPremium ? 1 : 0;
  
  // Primary stream gets higher quality
  if (isPrimary) {
    if (deviceTier === 'high') return 'source';
    if (deviceTier === 'medium') return streamCount > 4 ? 'high' : 'source';
    return streamCount > 2 ? 'medium' : 'high';
  }
  
  // Secondary streams quality degrades as count increases
  if (deviceTier === 'high') {
    if (streamCount <= 2 + premiumBoost) return 'source';
    if (streamCount <= 4 + premiumBoost) return 'high';
    if (streamCount <= 6 + premiumBoost) return 'medium';
    return 'low';
  }
  
  if (deviceTier === 'medium') {
    if (streamCount <= 2) return 'high';
    if (streamCount <= 3 + premiumBoost) return 'medium';
    if (streamCount <= 5 + premiumBoost) return 'low';
    return 'audio_only';
  }
  
  // Low-tier device
  if (streamCount <= 1 + premiumBoost) return 'medium';
  if (streamCount <= 2 + premiumBoost) return 'low';
  return 'audio_only';
};

const StreamQualityManager: React.FC<StreamQualityManagerProps> = ({
  streamCount,
  onQualityChange,
  children
}) => {
  const { user } = useAuth();
  const isPremium = user?.premium_flag || false;
  
  const [deviceCapabilities] = useState(detectDeviceCapabilities);
  const [currentQuality, setCurrentQuality] = useState<StreamQuality>('auto');
  const [showQualityChangedWarning, setShowQualityChangedWarning] = useState(false);
  const [qualityChangeMessage, setQualityChangeMessage] = useState('');
  
  // Performance metrics
  const fpsRef = useRef<number | null>(null);
  const memoryWarningsRef = useRef(0);
  const lastQualityChangeRef = useRef<number>(Date.now());
  
  // Monitor performance metrics
  useEffect(() => {
    const performanceCheckInterval = setInterval(() => {
      // Get current FPS
      fpsRef.current = performanceMonitor.getFPS();
      
      // If FPS is too low, consider reducing quality
      if (fpsRef.current && fpsRef.current < 20) {
        memoryWarningsRef.current += 1;
        
        // Only change quality if we've had multiple low FPS readings
        // and it's been at least 30 seconds since the last change
        if (
          memoryWarningsRef.current >= 3 && 
          Date.now() - lastQualityChangeRef.current > 30000
        ) {
          const newQuality: StreamQuality = 
            currentQuality === 'source' ? 'high' :
            currentQuality === 'high' ? 'medium' :
            currentQuality === 'medium' ? 'low' :
            currentQuality === 'low' ? 'audio_only' :
            'audio_only';
          
          if (newQuality !== currentQuality) {
            setCurrentQuality(newQuality);
            setQualityChangeMessage(
              `Stream quality automatically reduced to ${newQuality} due to performance issues`
            );
            setShowQualityChangedWarning(true);
            
            // Track quality reduction
            analytics.trackPerformanceEvent(PerformanceEvents.AUTO_QUALITY_CHANGE, {
              previousQuality: currentQuality,
              newQuality,
              reason: 'low_fps',
              fps: fpsRef.current,
              streamCount
            });
            
            // Call the callback if provided
            if (onQualityChange) {
              onQualityChange(newQuality);
            }
            
            // Reset counters
            memoryWarningsRef.current = 0;
            lastQualityChangeRef.current = Date.now();
          }
        }
      } else {
        // Reset counter if FPS is good
        memoryWarningsRef.current = Math.max(0, memoryWarningsRef.current - 1);
      }
    }, 5000);
    
    return () => clearInterval(performanceCheckInterval);
  }, [currentQuality, streamCount, onQualityChange]);
  
  // Adjust quality based on stream count and device capabilities
  useEffect(() => {
    // Don't change quality too frequently
    if (Date.now() - lastQualityChangeRef.current < 10000) {
      return;
    }
    
    const recommendedQuality = getRecommendedQuality(
      deviceCapabilities.tier,
      streamCount,
      true, // Assuming this is for the primary stream
      isPremium
    );
    
    // Only change if recommended quality is lower than current
    const qualityLevels: StreamQuality[] = ['source', 'high', 'medium', 'low', 'audio_only'];
    const currentIndex = qualityLevels.indexOf(currentQuality);
    const recommendedIndex = qualityLevels.indexOf(recommendedQuality);
    
    if (recommendedIndex > currentIndex) {
      setCurrentQuality(recommendedQuality);
      setQualityChangeMessage(
        `Stream quality adjusted to ${recommendedQuality} for optimal performance with ${streamCount} streams`
      );
      setShowQualityChangedWarning(true);
      
      // Track quality change
      analytics.trackPerformanceEvent(PerformanceEvents.AUTO_QUALITY_CHANGE, {
        previousQuality: currentQuality,
        newQuality: recommendedQuality,
        reason: 'stream_count_increase',
        streamCount,
        deviceTier: deviceCapabilities.tier
      });
      
      // Call the callback if provided
      if (onQualityChange) {
        onQualityChange(recommendedQuality);
      }
      
      lastQualityChangeRef.current = Date.now();
    }
  }, [streamCount, deviceCapabilities, isPremium, currentQuality, onQualityChange]);
  
  return (
    <>
      {showQualityChangedWarning && (
        <PerformanceWarning
          message={qualityChangeMessage}
          suggestion="You can manually adjust quality in stream settings"
          level="info"
          autoHide={true}
          autoHideDuration={8000}
          onClose={() => setShowQualityChangedWarning(false)}
        />
      )}
      {children}
    </>
  );
};

export default StreamQualityManager;