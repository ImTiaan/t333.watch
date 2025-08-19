/**
 * Pack Tracking Hook
 * 
 * This hook provides utilities for tracking pack-related events.
 * It wraps the analytics utility to provide a simpler API for tracking pack interactions.
 */

import { useCallback } from 'react';
import analytics, { EventCategory, PackEvents } from '@/lib/analytics';
import { useAuth } from '@/components/auth/AuthProvider';

export function usePackTracking() {
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Track when a user creates a pack
   * 
   * @param packId The ID of the created pack
   * @param packTitle The title of the created pack
   * @param streamCount The number of streams in the pack
   * @param properties Additional properties to include with the event
   */
  const trackCreatePack = useCallback((
    packId: string,
    packTitle: string,
    streamCount: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.CREATE_PACK, {
      packId,
      packTitle,
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
   * Track when a user updates a pack
   * 
   * @param packId The ID of the updated pack
   * @param packTitle The title of the updated pack
   * @param streamCount The number of streams in the pack
   * @param properties Additional properties to include with the event
   */
  const trackUpdatePack = useCallback((
    packId: string,
    packTitle: string,
    streamCount: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.UPDATE_PACK, {
      packId,
      packTitle,
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
   * Track when a user deletes a pack
   * 
   * @param packId The ID of the deleted pack
   * @param packTitle The title of the deleted pack
   * @param properties Additional properties to include with the event
   */
  const trackDeletePack = useCallback((
    packId: string,
    packTitle: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.DELETE_PACK, {
      packId,
      packTitle,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user views a pack
   * 
   * @param packId The ID of the viewed pack
   * @param packTitle The title of the viewed pack
   * @param streamCount The number of streams in the pack
   * @param isOwner Whether the viewer is the owner of the pack
   * @param properties Additional properties to include with the event
   */
  const trackViewPack = useCallback((
    packId: string,
    packTitle: string,
    streamCount: number,
    isOwner: boolean,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.VIEW_PACK, {
      packId,
      packTitle,
      streamCount,
      isOwner,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user shares a pack
   * 
   * @param packId The ID of the shared pack
   * @param packTitle The title of the shared pack
   * @param method The method used to share the pack
   * @param properties Additional properties to include with the event
   */
  const trackSharePack = useCallback((
    packId: string,
    packTitle: string,
    method: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.SHARE_PACK, {
      packId,
      packTitle,
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
   * Track when a user adds a stream to a pack
   * 
   * @param packId The ID of the pack
   * @param packTitle The title of the pack
   * @param channel The channel being added
   * @param newCount The new stream count after adding
   * @param properties Additional properties to include with the event
   */
  const trackAddToPack = useCallback((
    packId: string,
    packTitle: string,
    channel: string,
    newCount: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.ADD_TO_PACK, {
      packId,
      packTitle,
      channel,
      newCount,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user removes a stream from a pack
   * 
   * @param packId The ID of the pack
   * @param packTitle The title of the pack
   * @param channel The channel being removed
   * @param newCount The new stream count after removal
   * @param properties Additional properties to include with the event
   */
  const trackRemoveFromPack = useCallback((
    packId: string,
    packTitle: string,
    channel: string,
    newCount: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.REMOVE_FROM_PACK, {
      packId,
      packTitle,
      channel,
      newCount,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a pack operation results in an error
   * 
   * @param operation The operation that failed (create, update, delete, etc.)
   * @param errorMessage The error message
   * @param packId The ID of the pack (if available)
   * @param properties Additional properties to include with the event
   */
  const trackPackError = useCallback((
    operation: string,
    errorMessage: string,
    packId?: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackEvent(EventCategory.PACK, PackEvents.PACK_ERROR, {
      operation,
      errorMessage,
      packId,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  return {
    trackCreatePack,
    trackUpdatePack,
    trackDeletePack,
    trackViewPack,
    trackSharePack,
    trackAddToPack,
    trackRemoveFromPack,
    trackPackError
  };
}

export default usePackTracking;