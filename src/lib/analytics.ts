/**
 * Analytics Utility
 * 
 * This module provides a wrapper around Vercel Analytics for tracking custom events
 * throughout the application. It includes predefined event categories and methods
 * for tracking various user interactions.
 */

import { track } from '@vercel/analytics';

// Event Categories
export enum EventCategory {
  // User Authentication
  AUTH = 'auth',
  
  // Stream Interactions
  STREAM = 'stream',
  
  // Pack Interactions
  PACK = 'pack',
  
  // UI Interactions
  UI = 'ui',
  
  // Performance
  PERFORMANCE = 'performance',
  
  // Subscription
  SUBSCRIPTION = 'subscription',
  
  // Error
  ERROR = 'error',
  
  // Navigation
  NAVIGATION = 'navigation',
  
  // Feature Usage
  FEATURE = 'feature',
  
  // Social
  SOCIAL = 'social'
}

// Authentication Events
export const AuthEvents = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  TOKEN_REFRESH: 'token_refresh',
  AUTH_ERROR: 'auth_error'
};

// Stream Events
export const StreamEvents = {
  ADD_STREAM: 'add_stream',
  REMOVE_STREAM: 'remove_stream',
  SET_PRIMARY: 'set_primary_stream',
  CHANGE_AUDIO: 'change_audio',
  STREAM_ERROR: 'stream_error',
  STREAM_QUALITY_CHANGE: 'stream_quality_change',
  STREAM_BUFFERING: 'stream_buffering',
  MAX_STREAMS_REACHED: 'max_streams_reached'
};

// Pack Events
export const PackEvents = {
  CREATE_PACK: 'create_pack',
  UPDATE_PACK: 'update_pack',
  DELETE_PACK: 'delete_pack',
  VIEW_PACK: 'view_pack',
  SHARE_PACK: 'share_pack',
  ADD_TO_PACK: 'add_to_pack',
  REMOVE_FROM_PACK: 'remove_from_pack',
  PACK_ERROR: 'pack_error'
};

// UI Events
export const UIEvents = {
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  SIDEBAR_OPEN: 'sidebar_open',
  SIDEBAR_CLOSE: 'sidebar_close',
  THEME_CHANGE: 'theme_change',
  LAYOUT_CHANGE: 'layout_change',
  TOOLTIP_VIEW: 'tooltip_view',
  DROPDOWN_OPEN: 'dropdown_open'
};

// Performance Events
export const PerformanceEvents = {
  LOW_FPS: 'low_fps',
  HIGH_MEMORY: 'high_memory',
  SLOW_LOAD: 'slow_load',
  SLOW_RESPONSE: 'slow_response',
  API_LATENCY: 'api_latency',
  RESOURCE_ERROR: 'resource_error'
};

// Subscription Events
export const SubscriptionEvents = {
  VIEW_PLANS: 'view_plans',
  START_CHECKOUT: 'start_checkout',
  COMPLETE_CHECKOUT: 'complete_checkout',
  CANCEL_SUBSCRIPTION: 'cancel_subscription',
  UPGRADE_SUBSCRIPTION: 'upgrade_subscription',
  PAYMENT_ERROR: 'payment_error'
};

// Error Events
export const ErrorEvents = {
  API_ERROR: 'api_error',
  CLIENT_ERROR: 'client_error',
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  PERMISSION_ERROR: 'permission_error'
};

// Navigation Events
export const NavigationEvents = {
  PAGE_VIEW: 'page_view',
  EXTERNAL_LINK: 'external_link',
  INTERNAL_NAVIGATION: 'internal_navigation',
  BACK_BUTTON: 'back_button',
  SEARCH: 'search'
};

// Feature Usage Events
export const FeatureEvents = {
  FEATURE_DISCOVERY: 'feature_discovery',
  FEATURE_USAGE: 'feature_usage',
  PREMIUM_FEATURE_PROMPT: 'premium_feature_prompt',
  PREMIUM_FEATURE_USAGE: 'premium_feature_usage'
};

// Social Events
export const SocialEvents = {
  SHARE_CONTENT: 'share_content',
  COPY_LINK: 'copy_link',
  SOCIAL_SHARE: 'social_share'
};

// Properties interface for type safety
export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Track a custom event with Vercel Analytics
 * 
 * @param category The event category
 * @param action The specific action being tracked
 * @param properties Additional properties to include with the event
 */
export function trackEvent(
  category: EventCategory,
  action: string,
  properties?: EventProperties
) {
  // Create the event name by combining category and action
  const eventName = `${category}:${action}`;
  
  // Add timestamp to properties
  const eventProperties = {
    ...properties,
    timestamp: new Date().toISOString()
  };
  
  // Track the event with Vercel Analytics
  track(eventName, eventProperties);
  
  // Log the event in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, eventProperties);
  }
}

/**
 * Track a page view event
 * 
 * @param pageName The name of the page being viewed
 * @param properties Additional properties to include with the event
 */
export function trackPageView(pageName: string, properties?: EventProperties) {
  trackEvent(EventCategory.NAVIGATION, NavigationEvents.PAGE_VIEW, {
    page: pageName,
    url: typeof window !== 'undefined' ? window.location.pathname : '',
    ...properties
  });
}

/**
 * Track an error event
 * 
 * @param errorType The type of error
 * @param errorMessage The error message
 * @param properties Additional properties to include with the event
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  properties?: EventProperties
) {
  trackEvent(EventCategory.ERROR, errorType, {
    message: errorMessage,
    ...properties
  });
}

/**
 * Track a feature usage event
 * 
 * @param featureName The name of the feature being used
 * @param properties Additional properties to include with the event
 */
export function trackFeatureUsage(
  featureName: string,
  properties?: EventProperties
) {
  trackEvent(EventCategory.FEATURE, FeatureEvents.FEATURE_USAGE, {
    feature: featureName,
    ...properties
  });
}

/**
 * Track a stream event
 * 
 * @param action The stream action being performed
 * @param properties Additional properties to include with the event
 */
export function trackStreamEvent(
  action: string,
  properties?: EventProperties
) {
  trackEvent(EventCategory.STREAM, action, properties);
}

/**
 * Track a pack event
 * 
 * @param action The pack action being performed
 * @param properties Additional properties to include with the event
 */
export function trackPackEvent(
  action: string,
  properties?: EventProperties
) {
  trackEvent(EventCategory.PACK, action, properties);
}

/**
 * Track a performance event
 * 
 * @param action The performance metric being tracked
 * @param properties Additional properties to include with the event
 */
export function trackPerformanceEvent(
  action: string,
  properties?: EventProperties
) {
  trackEvent(EventCategory.PERFORMANCE, action, properties);
}

/**
 * Track a subscription event
 * 
 * @param action The subscription action being performed
 * @param properties Additional properties to include with the event
 */
export function trackSubscriptionEvent(
  action: string,
  properties?: EventProperties
) {
  trackEvent(EventCategory.SUBSCRIPTION, action, properties);
}

// Export a default object with all tracking functions
const analytics = {
  trackEvent,
  trackPageView,
  trackError,
  trackFeatureUsage,
  trackStreamEvent,
  trackPackEvent,
  trackPerformanceEvent,
  trackSubscriptionEvent
};

export default analytics;