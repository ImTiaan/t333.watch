/**
 * UI Tracking Hook
 * 
 * This hook provides utilities for tracking UI interaction events.
 * It wraps the analytics utility to provide a simpler API for tracking UI interactions.
 */

import { useCallback } from 'react';
import analytics, { EventCategory, UIEvents } from '@/lib/analytics';
import { useAuth } from '@/components/auth/AuthProvider';

export function useUITracking() {
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Track when a modal is opened
   * 
   * @param modalName The name of the modal being opened
   * @param properties Additional properties to include with the event
   */
  const trackModalOpen = useCallback((
    modalName: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.MODAL_OPEN, {
      modalName,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a modal is closed
   * 
   * @param modalName The name of the modal being closed
   * @param duration How long the modal was open (in ms)
   * @param properties Additional properties to include with the event
   */
  const trackModalClose = useCallback((
    modalName: string,
    duration?: number,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.MODAL_CLOSE, {
      modalName,
      duration,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a sidebar is opened
   * 
   * @param sidebarName The name of the sidebar being opened
   * @param properties Additional properties to include with the event
   */
  const trackSidebarOpen = useCallback((
    sidebarName: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.SIDEBAR_OPEN, {
      sidebarName,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a sidebar is closed
   * 
   * @param sidebarName The name of the sidebar being closed
   * @param duration How long the sidebar was open (in ms)
   * @param properties Additional properties to include with the event
   */
  const trackSidebarClose = useCallback((
    sidebarName: string,
    duration?: number,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.SIDEBAR_CLOSE, {
      sidebarName,
      duration,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user changes the theme
   * 
   * @param theme The new theme
   * @param previousTheme The previous theme
   * @param properties Additional properties to include with the event
   */
  const trackThemeChange = useCallback((
    theme: string,
    previousTheme: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.THEME_CHANGE, {
      theme,
      previousTheme,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a user changes the layout
   * 
   * @param layout The new layout
   * @param previousLayout The previous layout
   * @param properties Additional properties to include with the event
   */
  const trackLayoutChange = useCallback((
    layout: string,
    previousLayout: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.LAYOUT_CHANGE, {
      layout,
      previousLayout,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a tooltip is viewed
   * 
   * @param tooltipId The ID of the tooltip
   * @param properties Additional properties to include with the event
   */
  const trackTooltipView = useCallback((
    tooltipId: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.TOOLTIP_VIEW, {
      tooltipId,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  /**
   * Track when a dropdown is opened
   * 
   * @param dropdownId The ID of the dropdown
   * @param properties Additional properties to include with the event
   */
  const trackDropdownOpen = useCallback((
    dropdownId: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.trackEvent(EventCategory.UI, UIEvents.DROPDOWN_OPEN, {
      dropdownId,
      userId: user?.id,
      username: user?.display_name,
      isPremium: user?.premium_flag || false,
      isAuthenticated,
      timestamp: new Date().toISOString(),
      ...properties
    });
  }, [user, isAuthenticated]);
  
  return {
    trackModalOpen,
    trackModalClose,
    trackSidebarOpen,
    trackSidebarClose,
    trackThemeChange,
    trackLayoutChange,
    trackTooltipView,
    trackDropdownOpen
  };
}

export default useUITracking;