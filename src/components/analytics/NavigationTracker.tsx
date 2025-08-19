/**
 * Navigation Tracker Component
 * 
 * This component tracks navigation events between pages.
 * It uses the Next.js router to detect page changes and logs them to analytics.
 */

'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import analytics, { EventCategory, NavigationEvents } from '@/lib/analytics';

// Inner component that uses the navigation hooks
function NavigationTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track navigation events when the route changes
  useEffect(() => {
    if (pathname) {
      // Extract page name from pathname
      const pageName = pathname === '/'
        ? 'home'
        : pathname.split('/').filter(Boolean).join('/');
      
      // Get query parameters
      const queryParams: Record<string, string> = {};
      if (searchParams) {
        searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
      }
      
      // Track the navigation event
      analytics.trackEvent(EventCategory.NAVIGATION, NavigationEvents.INTERNAL_NAVIGATION, {
        from: document.referrer || 'direct',
        to: pathname,
        pageName,
        queryParams: Object.keys(queryParams).length > 0 ? JSON.stringify(queryParams) : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }, [pathname, searchParams]);

  // This is a tracking component, so it doesn't render anything
  return null;
}

// Wrapper component that provides the suspense boundary
export function NavigationTracker() {
  return (
    <Suspense fallback={null}>
      <NavigationTrackerInner />
    </Suspense>
  );
}

export default NavigationTracker;