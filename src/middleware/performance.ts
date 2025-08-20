/**
 * API Performance Middleware
 * 
 * This middleware tracks the performance of API requests, including:
 * - Request duration
 * - Payload sizes
 * - Slow requests
 * 
 * It logs performance metrics to the server console.
 */

import { NextRequest, NextResponse } from 'next/server';
import analytics, { EventCategory, PerformanceEvents } from '@/lib/analytics';

// Constants for performance thresholds
const PERFORMANCE_THRESHOLDS = {
  REQUEST_DURATION: {
    // In ms
    GOOD: 100,
    WARNING: 500,
    CRITICAL: 2000
  },
  PAYLOAD_SIZE: {
    // In bytes
    WARNING: 100000, // 100KB
    CRITICAL: 1000000 // 1MB
  }
};

// Helper function to format bytes to a human-readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to log performance metrics with color coding
function logPerformanceMetric(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  requestSize: number,
  responseSize: number
) {
  // Determine log level based on duration
  let logLevel = 'log';
  let durationStyle = 'color: green';
  
  if (duration > PERFORMANCE_THRESHOLDS.REQUEST_DURATION.CRITICAL) {
    logLevel = 'error';
    durationStyle = 'color: red; font-weight: bold';
  } else if (duration > PERFORMANCE_THRESHOLDS.REQUEST_DURATION.WARNING) {
    logLevel = 'warn';
    durationStyle = 'color: orange; font-weight: bold';
  }
  
  // Format the log message
  const timestamp = new Date().toISOString();
  
  // Create the log message
  const message = `[${timestamp}] ${method} ${path} ${statusCode}`;
  const details = `Duration: ${duration.toFixed(2)}ms | Request: ${formatBytes(requestSize)} | Response: ${formatBytes(responseSize)}`;
  
  // Log with appropriate level and styling
  if (logLevel === 'error') {
    console.error(
      `%c${message} %c${details}`,
      `font-weight: bold;`,
      `${durationStyle};`
    );
  } else if (logLevel === 'warn') {
    console.warn(
      `%c${message} %c${details}`,
      `font-weight: bold;`,
      `${durationStyle};`
    );
  } else {
    console.log(
      `%c${message} %c${details}`,
      `font-weight: bold;`,
      `${durationStyle};`
    );
  }
  
  // Log additional details for slow requests
  if (duration > PERFORMANCE_THRESHOLDS.REQUEST_DURATION.WARNING) {
    console.warn(`Slow request detected: ${method} ${path} (${duration.toFixed(2)}ms)`);
    
    // Track slow API requests with analytics
    analytics.trackPerformanceEvent(PerformanceEvents.API_LATENCY, {
      method,
      path,
      duration: Math.round(duration),
      statusCode,
      requestSize: formatBytes(requestSize),
      responseSize: formatBytes(responseSize)
    });
  }
  
  // Track API errors
  if (statusCode >= 400) {
    analytics.trackEvent(EventCategory.ERROR, 'api_error', {
      method,
      path,
      statusCode,
      duration: Math.round(duration)
    });
  }
}

// Performance middleware function
export function performanceMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  // Skip performance tracking for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return response;
  }
  
  // Get request details
  const method = request.method;
  const path = request.nextUrl.pathname;
  const startTime = Date.now();
  
  // Get request size (approximate)
  const requestSize = request.headers.get('content-length') 
    ? parseInt(request.headers.get('content-length') || '0', 10)
    : 0;
  
  // Clone the response to avoid modifying the original
  const responseClone = response.clone();
  
  // Get response details
  const statusCode = responseClone.status;
  
  // Get response size (approximate)
  const responseSize = responseClone.headers.get('content-length')
    ? parseInt(responseClone.headers.get('content-length') || '0', 10)
    : 0;
  
  // Calculate request duration
  const duration = Date.now() - startTime;
  
  // Log performance metrics
  logPerformanceMetric(
    method,
    path,
    statusCode,
    duration,
    requestSize,
    responseSize
  );
  
  // Add performance headers to the response in development mode
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Request-Size', formatBytes(requestSize));
    response.headers.set('X-Response-Size', formatBytes(responseSize));
  }
  
  return response;
}

// Middleware factory function for Next.js
export default function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Apply performance middleware
  return performanceMiddleware(request, response);
}

// Configure middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
};