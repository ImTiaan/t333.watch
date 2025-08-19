/**
 * Analytics Provider Component
 * 
 * This component wraps the application to provide analytics tracking functionality.
 * It automatically tracks page views and provides context for tracking custom events.
 */

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { trackPageView } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views when the route changes
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
      
      // Track the page view
      trackPageView(pageName, {
        pathname,
        queryParams: Object.keys(queryParams).length > 0 ? JSON.stringify(queryParams) : undefined,
        referrer: document.referrer || undefined
      });
    }
  }, [pathname, searchParams]);

  return (
    <>
      {children}
      <Analytics />
    </>
  );
}

export default AnalyticsProvider;