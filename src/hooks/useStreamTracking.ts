/**
 * Stream Tracking Hook
 * 
 * This hook provides utilities for tracking stream-related events.
 * It wraps the analytics utility to provide a simpler API for tracking stream interactions.
 */

import { useCallback } from 'react';
import analytics, { EventCategory, StreamEvents } from '@/lib/analytics';
import { useAuth } from '@/components/auth/AuthProvider';

export function useStreamTracking() {
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Track when a user adds a stream to the viewer
   * 
   * @param channel The channel being added
   * @param streamCount The total number of streams after adding
   * @param properties Additional properties to include with the event
   */
  const trackAddStream = useCallback((
    channel: string,
    streamCount: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.ADD_STREAM, {
      channel,
      streamCount,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user removes a stream from the viewer
   * 
   * @param channel The channel being removed
   * @param streamCount The total number of streams after removal
   * @param properties Additional properties to include with the event
   */
  const trackRemoveStream = useCallback((
    channel: string,
    streamCount: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.REMOVE_STREAM, {
      channel,
      streamCount,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user sets a stream as primary
   * 
   * @param channel The channel being set as primary
   * @param previousPrimary The previous primary channel (if any)
   * @param properties Additional properties to include with the event
   */
  const trackSetPrimaryStream = useCallback((
    channel: string,
    previousPrimary?: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.SET_PRIMARY, {
      channel,
      previousPrimary,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user changes the active audio stream
   * 
   * @param channel The channel being set as the audio source
   * @param properties Additional properties to include with the event
   */
  const trackChangeAudio = useCallback((
    channel: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.CHANGE_AUDIO, {
      channel,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a stream encounters an error
   * 
   * @param channel The channel that encountered an error
   * @param errorMessage The error message
   * @param properties Additional properties to include with the event
   */
  const trackStreamError = useCallback((
    channel: string,
    errorMessage: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.STREAM_ERROR, {
      channel,
      errorMessage,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a stream changes quality
   * 
   * @param channel The channel that changed quality
   * @param newQuality The new quality level
   * @param previousQuality The previous quality level
   * @param properties Additional properties to include with the event
   */
  const trackQualityChange = useCallback((
    channel: string,
    newQuality: string,
    previousQuality: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.STREAM_QUALITY_CHANGE, {
      channel,
      newQuality,
      previousQuality,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a stream starts buffering
   * 
   * @param channel The channel that is buffering
   * @param properties Additional properties to include with the event
   */
  const trackBuffering = useCallback((
    channel: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.STREAM_BUFFERING, {
      channel,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user reaches the maximum number of streams
   * 
   * @param maxStreams The maximum number of streams allowed
   * @param attemptedChannel The channel the user tried to add
   * @param properties Additional properties to include with the event
   */
  const trackMaxStreamsReached = useCallback((
    maxStreams: number,
    attemptedChannel?: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.STREAM, StreamEvents.MAX_STREAMS_REACHED, {
      maxStreams,
      attemptedChannel,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  return {
    trackAddStream,
    trackRemoveStream,
    trackSetPrimaryStream,
    trackChangeAudio,
    trackStreamError,
    trackQualityChange,
    trackBuffering,
    trackMaxStreamsReached
  };
}

export default useStreamTracking;