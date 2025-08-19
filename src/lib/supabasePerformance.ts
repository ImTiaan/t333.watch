/**
 * Supabase Performance Tracking
 *
 * This module extends the Supabase client to track query performance.
 * It wraps Supabase methods to measure execution time and log performance metrics.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import analytics, { EventCategory, PerformanceEvents } from '@/lib/analytics';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Constants for performance thresholds
const PERFORMANCE_THRESHOLDS = {
  QUERY_DURATION: {
    // In ms
    GOOD: 100,
    WARNING: 300,
    CRITICAL: 1000
  }
};

// Helper function to log query performance
function logQueryPerformance(
  method: string,
  table: string,
  duration: number,
  query: string,
  params?: any
) {
  // Determine log level based on duration
  let logLevel = 'log';
  let style = 'color: green';
  
  if (duration > PERFORMANCE_THRESHOLDS.QUERY_DURATION.CRITICAL) {
    logLevel = 'error';
    style = 'color: red; font-weight: bold';
  } else if (duration > PERFORMANCE_THRESHOLDS.QUERY_DURATION.WARNING) {
    logLevel = 'warn';
    style = 'color: orange; font-weight: bold';
  }
  
  // Format the log message
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [DB] ${method} ${table}`;
  const details = `Duration: ${duration.toFixed(2)}ms | Query: ${query}`;
  
  // Log with appropriate level and styling
  if (logLevel === 'error') {
    console.error(
      `%c${message} %c${details}`,
      `font-weight: bold;`,
      `${style};`,
      params
    );
  } else if (logLevel === 'warn') {
    console.warn(
      `%c${message} %c${details}`,
      `font-weight: bold;`,
      `${style};`,
      params
    );
  } else {
    console.log(
      `%c${message} %c${details}`,
      `font-weight: bold;`,
      `${style};`,
      params
    );
  }
  
  // Log additional details for slow queries
  if (duration > PERFORMANCE_THRESHOLDS.QUERY_DURATION.WARNING) {
    console.warn(`Slow query detected: ${method} ${table} (${duration.toFixed(2)}ms)`);
    if (params) {
      console.warn('Query parameters:', params);
    }
    
    // Track slow query with analytics
    analytics.trackPerformanceEvent(PerformanceEvents.SLOW_RESPONSE, {
      type: 'database',
      method,
      table,
      duration: Math.round(duration),
      query
    });
  }
}

// Function to create a performance-tracking Supabase client wrapper
export function createPerformanceTrackingSupabase(supabase: SupabaseClient): SupabaseClient {
  // Only apply in development mode
  if (process.env.NODE_ENV !== 'development') {
    return supabase;
  }
  
  // Create a proxy to intercept Supabase method calls
  const handler = {
    get(target: any, prop: string) {
      // If the property is a function, wrap it
      if (typeof target[prop] === 'function') {
        return function(...args: any[]) {
          return target[prop](...args);
        };
      }
      
      // If the property is 'from', wrap the returned query builder
      if (prop === 'from') {
        return function(table: string) {
          const queryBuilder = target.from(table);
          
          // Create a proxy for the query builder
          return new Proxy(queryBuilder, {
            get(qbTarget: any, qbProp: string) {
              // If the property is a query method, wrap it to measure performance
              if (['select', 'insert', 'update', 'delete', 'upsert'].includes(qbProp)) {
                return function(...qbArgs: any[]) {
                  const startTime = isBrowser ? performance.now() : Date.now();
                  const query = `${qbProp}(${qbArgs.map(a => JSON.stringify(a)).join(', ')})`;
                  
                  // Execute the original method
                  const result = qbTarget[qbProp](...qbArgs);
                  
                  // For methods that return a promise
                  if (result && typeof result.then === 'function') {
                    return result.then((data: any) => {
                      const duration = (isBrowser ? performance.now() : Date.now()) - startTime;
                      logQueryPerformance(qbProp, table, duration, query, { args: qbArgs, result: data });
                      return data;
                    }).catch((error: any) => {
                      const duration = (isBrowser ? performance.now() : Date.now()) - startTime;
                      console.error(
                        `%c[DB ERROR] ${qbProp} ${table} (${duration.toFixed(2)}ms)`,
                        'color: red; font-weight: bold',
                        error,
                        { query, args: qbArgs }
                      );
                      
                      // Track database error with analytics
                      analytics.trackEvent(EventCategory.ERROR, 'database_error', {
                        method: qbProp,
                        table,
                        duration: Math.round(duration),
                        errorMessage: error?.message || 'Unknown database error',
                        errorCode: error?.code
                      });
                      
                      throw error;
                    });
                  }
                  
                  // For methods that don't return a promise
                  const duration = (isBrowser ? performance.now() : Date.now()) - startTime;
                  logQueryPerformance(qbProp, table, duration, query, { args: qbArgs, result });
                  return result;
                };
              }
              
              // For other properties, return the original
              return qbTarget[qbProp];
            }
          });
        };
      }
      
      // For other properties, return the original
      return target[prop];
    }
  };
  
  return new Proxy(supabase, handler);
}

// Function to wrap an existing Supabase client
export function wrapSupabaseWithPerformanceTracking(supabase: SupabaseClient): SupabaseClient {
  return createPerformanceTrackingSupabase(supabase);
}

// Export a function to log a summary of database performance
export function logDatabasePerformanceSummary(metrics: {
  totalQueries: number;
  totalDuration: number;
  slowQueries: number;
  averageDuration: number;
  maxDuration: number;
}) {
  console.group('%c📊 Database Performance Summary', 'font-weight: bold; font-size: 14px; color: #9146FF;');
  
  const { totalQueries, totalDuration, slowQueries, averageDuration, maxDuration } = metrics;
  
  console.log(
    `%cTotal Queries: ${totalQueries} | Avg Duration: ${averageDuration.toFixed(2)}ms | Max: ${maxDuration.toFixed(2)}ms`,
    averageDuration > PERFORMANCE_THRESHOLDS.QUERY_DURATION.WARNING ? 'color: orange;' : 'color: green;'
  );
  
  console.log(
    `%cSlow Queries: ${slowQueries} (${((slowQueries / totalQueries) * 100).toFixed(1)}%)`,
    slowQueries > 0 ? 'color: orange; font-weight: bold;' : 'color: green;'
  );
  
  console.groupEnd();
  
  // Track database performance summary with analytics
  analytics.trackPerformanceEvent('database_summary', {
    totalQueries,
    totalDuration: Math.round(totalDuration),
    slowQueries,
    averageDuration: Math.round(averageDuration),
    maxDuration: Math.round(maxDuration),
    slowQueryPercentage: parseFloat(((slowQueries / totalQueries) * 100).toFixed(1))
  });
}