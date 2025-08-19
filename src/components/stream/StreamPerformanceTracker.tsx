/**
 * Stream Performance Tracker Component
 * 
 * This component tracks the performance of Twitch streams, including:
 * - Stream loading times
 * - Playback performance
 * - Stalls and buffering events
 * 
 * It uses the performance monitoring service to log metrics to the console.
 */

import { useEffect, useRef } from 'react';
import performanceMonitor from '@/lib/performance';
import analytics, { EventCategory, StreamEvents, PerformanceEvents } from '@/lib/analytics';

interface StreamPerformanceTrackerProps {
  streamId: string;
  playerId: string;
  embed?: any; // Twitch embed instance
  isVisible?: boolean;
}

const StreamPerformanceTracker: React.FC<StreamPerformanceTrackerProps> = ({
  streamId,
  playerId,
  embed,
  isVisible = true
}) => {
  // Refs to track performance data
  const loadStartTimeRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const bufferingStartTimeRef = useRef<number | null>(null);
  const lastPlaybackStateRef = useRef<string>('initial');
  const playerReadyRef = useRef<boolean>(false);
  const lastQualityRef = useRef<string | null>(null);
  
  // Generate a unique ID for this stream instance
  const streamInstanceId = useRef<string>(`stream-${streamId}-${Date.now()}`);
  
  useEffect(() => {
    if (!embed) return;
    
    // Start tracking load time
    const loadTrackingId = `stream-load-${streamInstanceId.current}`;
    performanceMonitor.trackLoadStart(loadTrackingId);
    loadStartTimeRef.current = performance.now();
    
    // Event handlers for Twitch player events
    const handleReady = () => {
      if (loadStartTimeRef.current) {
        const loadTime = performance.now() - loadStartTimeRef.current;
        performanceMonitor.trackLoadEnd(loadTrackingId, 'Stream Load');
        
        performanceMonitor.logMetric({
          loadTime,
          context: 'Stream Ready',
          details: {
            streamId,
            playerId
          }
        });
        
        // Track analytics event for stream load time
        if (loadTime > 3000) {
          // Only track slow loads (> 3 seconds)
          analytics.trackPerformanceEvent(PerformanceEvents.SLOW_LOAD, {
            loadTime,
            streamId,
            channel: streamId.split('-').pop() || 'unknown'
          });
        }
      }
      
      playerReadyRef.current = true;
    };
    
    const handlePlay = () => {
      if (lastPlaybackStateRef.current !== 'playing') {
        playStartTimeRef.current = performance.now();
        
        // If we were buffering, calculate buffering time
        if (lastPlaybackStateRef.current === 'buffering' && bufferingStartTimeRef.current) {
          const bufferingTime = performance.now() - bufferingStartTimeRef.current;
          
          performanceMonitor.logMetric({
            loadTime: bufferingTime,
            context: 'Stream Buffering',
            details: {
              streamId,
              playerId,
              state: 'ended'
            }
          });
          
          bufferingStartTimeRef.current = null;
        }
        
        lastPlaybackStateRef.current = 'playing';
        
        performanceMonitor.logMetric({
          context: 'Stream Playback',
          details: {
            streamId,
            playerId,
            state: 'playing'
          }
        });
      }
    };
    
    const handlePause = () => {
      if (lastPlaybackStateRef.current === 'playing') {
        lastPlaybackStateRef.current = 'paused';
        
        performanceMonitor.logMetric({
          context: 'Stream Playback',
          details: {
            streamId,
            playerId,
            state: 'paused'
          }
        });
      }
    };
    
    const handleBuffering = () => {
      if (lastPlaybackStateRef.current !== 'buffering') {
        bufferingStartTimeRef.current = performance.now();
        lastPlaybackStateRef.current = 'buffering';
        
        performanceMonitor.logMetric({
          context: 'Stream Buffering',
          details: {
            streamId,
            playerId,
            state: 'started'
          }
        });
        
        // Track analytics event for stream buffering
        analytics.trackStreamEvent(StreamEvents.STREAM_BUFFERING, {
          streamId,
          channel: streamId.split('-').pop() || 'unknown',
          state: 'started',
          timestamp: new Date().toISOString()
        });
      }
    };
    
    const handleError = (error: any) => {
      performanceMonitor.logMetric({
        context: 'Stream Error',
        details: {
          streamId,
          playerId,
          error: error?.message || 'Unknown error'
        }
      });
      
      // Track analytics event for stream error
      analytics.trackStreamEvent(StreamEvents.STREAM_ERROR, {
        streamId,
        channel: streamId.split('-').pop() || 'unknown',
        errorMessage: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      // Also track as a general error
      analytics.trackError('stream_error', error?.message || 'Unknown stream error', {
        streamId,
        channel: streamId.split('-').pop() || 'unknown',
        playerId
      });
    };
    
    // Add event listeners to the Twitch player
    try {
      if (embed.addEventListener) {
        embed.addEventListener('ready', handleReady);
        embed.addEventListener('play', handlePlay);
        embed.addEventListener('pause', handlePause);
        
        // These events might not be directly exposed by the Twitch API
        // We'll try to use them, but they might not work
        embed.addEventListener('buffering', handleBuffering);
        embed.addEventListener('error', handleError);
      }
      
      // Get the player instance if available
      const player = embed.getPlayer?.();
      if (player) {
        // Some events might be available on the player instead of the embed
        if (player.addEventListener) {
          player.addEventListener('buffering', handleBuffering);
          player.addEventListener('error', handleError);
        }
      }
    } catch (error) {
      console.warn('Error setting up stream performance tracking:', error);
    }
    
    // Set up periodic quality checks if the player is visible
    let qualityCheckInterval: number | null = null;
    
    if (isVisible) {
      qualityCheckInterval = window.setInterval(() => {
        if (!playerReadyRef.current) return;
        
        try {
          const player = embed.getPlayer?.();
          if (player) {
            // Get current playback quality if available
            const quality = player.getQuality?.();
            const volume = player.getVolume?.();
            const muted = player.getMuted?.();
            
            // Log quality metrics
            performanceMonitor.logMetric({
              context: 'Stream Quality',
              details: {
                streamId,
                playerId,
                quality,
                volume,
                muted,
                state: lastPlaybackStateRef.current
              }
            });
            
            // Track quality change analytics event (only when quality changes)
            if (quality && quality !== lastQualityRef.current) {
              analytics.trackStreamEvent(StreamEvents.STREAM_QUALITY_CHANGE, {
                streamId,
                channel: streamId.split('-').pop() || 'unknown',
                previousQuality: lastQualityRef.current || 'unknown',
                newQuality: quality,
                timestamp: new Date().toISOString()
              });
              
              // Update last quality reference
              lastQualityRef.current = quality;
            }
          }
        } catch (error) {
          // Ignore errors in quality checking
        }
      }, 10000); // Check every 10 seconds
    }
    
    // Cleanup function
    return () => {
      // Remove event listeners
      try {
        if (embed.removeEventListener) {
          embed.removeEventListener('ready', handleReady);
          embed.removeEventListener('play', handlePlay);
          embed.removeEventListener('pause', handlePause);
          embed.removeEventListener('buffering', handleBuffering);
          embed.removeEventListener('error', handleError);
        }
        
        const player = embed.getPlayer?.();
        if (player && player.removeEventListener) {
          player.removeEventListener('buffering', handleBuffering);
          player.removeEventListener('error', handleError);
        }
      } catch (error) {
        // Ignore errors in cleanup
      }
      
      // Clear interval
      if (qualityCheckInterval !== null) {
        clearInterval(qualityCheckInterval);
      }
      
      // Log final metrics
      if (lastPlaybackStateRef.current === 'buffering' && bufferingStartTimeRef.current) {
        const bufferingTime = performance.now() - bufferingStartTimeRef.current;
        
        performanceMonitor.logMetric({
          loadTime: bufferingTime,
          context: 'Stream Buffering',
          details: {
            streamId,
            playerId,
            state: 'ended (component unmount)'
          }
        });
      }
      
      performanceMonitor.logMetric({
        context: 'Stream Tracker',
        details: {
          streamId,
          playerId,
          event: 'unmounted'
        }
      });
    };
  }, [embed, streamId, playerId, isVisible]);
  
  // This is a tracking component, so it doesn't render anything
  return null;
};

export default StreamPerformanceTracker;