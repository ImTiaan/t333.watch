# Analytics Implementation Guide

This document provides an overview of the analytics implementation in t333.watch, including how to track events and what events are being tracked.

## Overview

t333.watch uses Vercel Analytics to track user interactions and application performance. The analytics implementation is designed to be:

1. **Comprehensive** - Tracking a wide range of events across the application
2. **Privacy-focused** - Only tracking necessary information
3. **Performance-optimized** - Minimal impact on application performance
4. **Developer-friendly** - Easy to use and extend

## Analytics Architecture

The analytics implementation consists of several components:

1. **Core Analytics Utility** (`src/lib/analytics.ts`) - Provides the foundation for all analytics tracking
2. **Tracking Hooks** (`src/hooks/use*Tracking.ts`) - Provide domain-specific tracking functions
3. **Analytics Provider** (`src/components/analytics/AnalyticsProvider.tsx`) - Wraps the application to provide analytics context
4. **Navigation Tracker** (`src/components/analytics/NavigationTracker.tsx`) - Tracks page navigation events

## Event Categories

Events are organized into the following categories:

- **Auth** - Authentication-related events (login, logout, etc.)
- **Stream** - Stream-related events (add, remove, etc.)
- **Pack** - Pack-related events (create, update, etc.)
- **UI** - UI interaction events (modal open/close, etc.)
- **Performance** - Performance-related events (slow loads, errors, etc.)
- **Subscription** - Subscription-related events (checkout, cancel, etc.)
- **Error** - Error events (API errors, client errors, etc.)
- **Navigation** - Navigation events (page views, etc.)
- **Feature** - Feature usage events (feature discovery, etc.)
- **Social** - Social sharing events (share content, etc.)

## Tracking Hooks

The following hooks are available for tracking events:

- **useFeatureTracking** - Track feature usage
- **useSharingTracking** - Track social sharing
- **useSubscriptionTracking** - Track subscription events
- **usePackTracking** - Track pack-related events
- **useStreamTracking** - Track stream-related events
- **useUITracking** - Track UI interaction events

## How to Use

### Basic Event Tracking

To track a custom event, use the `trackEvent` function from the analytics utility:

```typescript
import analytics, { EventCategory } from '@/lib/analytics';

// Track a custom event
analytics.trackEvent(EventCategory.UI, 'button_click', {
  buttonId: 'submit',
  page: 'checkout'
});
```

### Using Tracking Hooks

For domain-specific events, use the appropriate tracking hook:

```typescript
import { useStreamTracking } from '@/hooks';

function StreamComponent({ channel }) {
  const { trackAddStream, trackRemoveStream } = useStreamTracking();
  
  const handleAddStream = () => {
    // Add stream logic...
    
    // Track the event
    trackAddStream(channel, streamCount);
  };
  
  // ...
}
```

### Tracking Page Views

Page views are automatically tracked by the `NavigationTracker` component, which is included in the root layout.

### Tracking Performance

Performance metrics are automatically tracked by the performance monitoring system. You can also manually track performance events:

```typescript
import analytics, { EventCategory, PerformanceEvents } from '@/lib/analytics';

// Track a slow operation
analytics.trackPerformanceEvent(PerformanceEvents.SLOW_RESPONSE, {
  operation: 'data_fetch',
  duration: 1500 // ms
});
```

## Events Being Tracked

### Authentication Events

- **Login** - When a user logs in
- **Logout** - When a user logs out
- **Token Refresh** - When a user's authentication token is refreshed
- **Auth Error** - When an authentication error occurs

### Stream Events

- **Add Stream** - When a user adds a stream to the viewer
- **Remove Stream** - When a user removes a stream from the viewer
- **Set Primary Stream** - When a user sets a stream as primary
- **Change Audio** - When a user changes the active audio stream
- **Stream Error** - When a stream encounters an error
- **Stream Quality Change** - When a stream changes quality
- **Stream Buffering** - When a stream starts buffering
- **Max Streams Reached** - When a user reaches the maximum number of streams

### Pack Events

- **Create Pack** - When a user creates a pack
- **Update Pack** - When a user updates a pack
- **Delete Pack** - When a user deletes a pack
- **View Pack** - When a user views a pack
- **Share Pack** - When a user shares a pack
- **Add to Pack** - When a user adds a stream to a pack
- **Remove from Pack** - When a user removes a stream from a pack
- **Pack Error** - When a pack operation results in an error

### UI Events

- **Modal Open** - When a modal is opened
- **Modal Close** - When a modal is closed
- **Sidebar Open** - When a sidebar is opened
- **Sidebar Close** - When a sidebar is closed
- **Theme Change** - When a user changes the theme
- **Layout Change** - When a user changes the layout
- **Tooltip View** - When a tooltip is viewed
- **Dropdown Open** - When a dropdown is opened

### Performance Events

- **Low FPS** - When the FPS drops below a threshold
- **High Memory** - When memory usage exceeds a threshold
- **Slow Load** - When a component takes too long to load
- **Slow Response** - When an operation takes too long to complete
- **API Latency** - When an API request takes too long
- **Resource Error** - When a resource fails to load

### Subscription Events

- **View Plans** - When a user views subscription plans
- **Start Checkout** - When a user starts the checkout process
- **Complete Checkout** - When a user completes the checkout process
- **Cancel Subscription** - When a user cancels their subscription
- **Upgrade Subscription** - When a user upgrades their subscription
- **Payment Error** - When a payment error occurs

### Navigation Events

- **Page View** - When a user views a page
- **External Link** - When a user clicks an external link
- **Internal Navigation** - When a user navigates within the application
- **Back Button** - When a user clicks the back button
- **Search** - When a user performs a search

### Feature Events

- **Feature Discovery** - When a user discovers a feature
- **Feature Usage** - When a user uses a feature
- **Premium Feature Prompt** - When a user is prompted to upgrade for a premium feature
- **Premium Feature Usage** - When a premium user uses a premium feature

### Social Events

- **Share Content** - When a user shares content
- **Copy Link** - When a user copies a link
- **Social Share** - When a user shares content on social media

## Viewing Analytics Data

Analytics data can be viewed in the Vercel Analytics dashboard. To access the dashboard:

1. Go to the [Vercel Dashboard](https://vercel.com)
2. Select the t333.watch project
3. Click on the "Analytics" tab

## Extending Analytics

To add new events or event categories:

1. Add the new event or category to the appropriate enum in `src/lib/analytics.ts`
2. Create a new tracking function in the appropriate hook or create a new hook
3. Use the tracking function in your components

## Best Practices

1. **Be consistent** - Use the same event names and properties across the application
2. **Be descriptive** - Use clear and descriptive event names and properties
3. **Don't over-track** - Only track events that provide valuable insights
4. **Respect privacy** - Don't track sensitive information
5. **Test tracking** - Verify that events are being tracked correctly