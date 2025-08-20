/**
 * Performance Monitoring Service
 *
 * This module provides functionality for tracking and logging performance metrics
 * in the browser. It focuses on key metrics like FPS, memory usage, stream loading
 * time, and UI responsiveness.
 *
 * NOTE: This module is designed to run only in the browser environment.
 */

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

// Constants for performance thresholds
const PERFORMANCE_THRESHOLDS = {
  FPS: {
    GOOD: 50,
    WARNING: 30,
    // Below WARNING is considered poor
  },
  MEMORY: {
    // In MB
    WARNING: 500,
    CRITICAL: 1000,
  },
  LOAD_TIME: {
    // In ms
    GOOD: 1000,
    WARNING: 3000,
    // Above WARNING is considered poor
  },
  RESPONSE_TIME: {
    // In ms
    GOOD: 100,
    WARNING: 300,
    // Above WARNING is considered poor
  }
};

// Types for performance metrics
export interface PerformanceMetrics {
  fps?: number;
  memory?: number;
  loadTime?: number;
  responseTime?: number;
  timestamp: number;
  context?: string;
  details?: Record<string, unknown>;
}

// Sampling rate (1 = every frame, 2 = every other frame, etc.)
const DEFAULT_SAMPLING_RATE = 10;

// Class to track FPS
class FPSTracker {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 0;
  private samplingRate: number;
  private enabled = false;
  private rafId: number | null = null;

  constructor(samplingRate = DEFAULT_SAMPLING_RATE) {
    this.samplingRate = samplingRate;
  }

  start() {
    if (!isBrowser || this.enabled) return;
    this.enabled = true;
    this.track();
  }

  stop() {
    this.enabled = false;
    if (isBrowser && this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS() {
    return this.fps;
  }

  private track() {
    this.frames++;
    
    const now = performance.now();
    const elapsed = now - this.lastTime;
    
    // Update FPS every second
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastTime = now;
      
      // Log FPS every N seconds based on sampling rate
      if (this.samplingRate > 0 && this.frames % this.samplingRate === 0) {
        performanceLogger.logMetric({
          fps: this.fps,
          timestamp: now,
          context: 'FPS Tracker'
        });
      }
    }
    
    if (this.enabled && isBrowser) {
      this.rafId = requestAnimationFrame(() => this.track());
    }
  }
}

// Class to track memory usage
class MemoryTracker {
  private intervalId: number | null = null;
  private samplingRate: number;
  
  constructor(samplingIntervalMs = 5000) {
    this.samplingRate = samplingIntervalMs;
  }
  
  start() {
    if (!isBrowser || this.intervalId !== null) return;
    
    this.intervalId = window.setInterval(() => {
      this.trackMemory();
    }, this.samplingRate);
    
    // Track immediately on start
    this.trackMemory();
  }
  
  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private trackMemory() {
    // Only run in browser and check if performance.memory is available (Chrome only)
    if (isBrowser && performance && (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory) {
      const memoryInfo = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      const usedHeapSizeMB = Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024));
      
      performanceLogger.logMetric({
        memory: usedHeapSizeMB,
        timestamp: performance.now(),
        context: 'Memory Tracker',
        details: {
          totalHeapSizeMB: Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024)),
          heapLimitMB: Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))
        }
      });
    } else {
      // Memory info not available in this browser
      console.debug('Performance memory metrics not available in this browser');
    }
  }
}

// Class to track load times
class LoadTimeTracker {
  private loadTimes: Record<string, number> = {};
  
  startTiming(id: string) {
    if (!isBrowser) return;
    this.loadTimes[id] = performance.now();
  }
  
  endTiming(id: string, context = 'Load Time') {
    if (!isBrowser) return null;
    
    if (this.loadTimes[id]) {
      const startTime = this.loadTimes[id];
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      delete this.loadTimes[id];
      
      performanceLogger.logMetric({
        loadTime,
        timestamp: endTime,
        context,
        details: { id }
      });
      
      return loadTime;
    }
    
    console.warn(`No start time found for timing id: ${id}`);
    return null;
  }
}

// Class to track UI responsiveness
class ResponsivenessTracker {
  private interactions: Record<string, number> = {};
  
  trackInteractionStart(id: string) {
    if (!isBrowser) return;
    this.interactions[id] = performance.now();
  }
  
  trackInteractionEnd(id: string) {
    if (!isBrowser) return null;
    
    if (this.interactions[id]) {
      const startTime = this.interactions[id];
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      delete this.interactions[id];
      
      performanceLogger.logMetric({
        responseTime,
        timestamp: endTime,
        context: 'UI Responsiveness',
        details: { id }
      });
      
      return responseTime;
    }
    
    console.warn(`No start time found for interaction id: ${id}`);
    return null;
  }
}

// Performance Logger class for console output
class PerformanceLogger {
  private metrics: PerformanceMetrics[] = [];
  private maxStoredMetrics = 100;
  private summaryInterval: number | null = null;
  
  constructor() {
    if (isBrowser) {
      // Set up periodic summary logging
      this.startSummaryLogging(60000); // Default to every minute
    }
  }
  
  startSummaryLogging(intervalMs: number) {
    if (!isBrowser) return;
    
    if (this.summaryInterval !== null) {
      clearInterval(this.summaryInterval);
    }
    
    this.summaryInterval = window.setInterval(() => {
      this.logSummary();
    }, intervalMs);
  }
  
  stopSummaryLogging() {
    if (this.summaryInterval !== null) {
      clearInterval(this.summaryInterval);
      this.summaryInterval = null;
    }
  }
  
  logMetric(metric: PerformanceMetrics) {
    // Store metric for summary
    this.metrics.push(metric);
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics.shift();
    }
    
    // Log to console with appropriate formatting
    this.formatAndLogMetric(metric);
  }
  
  private formatAndLogMetric(metric: PerformanceMetrics) {
    const timestamp = new Date(metric.timestamp).toISOString().split('T')[1].slice(0, -1);
    let logLevel = 'log';
    let style = '';
    
    // Determine log level and style based on metrics
    if (metric.fps !== undefined) {
      if (metric.fps < PERFORMANCE_THRESHOLDS.FPS.WARNING) {
        logLevel = 'warn';
        style = 'color: orange; font-weight: bold;';
      } else if (metric.fps < PERFORMANCE_THRESHOLDS.FPS.GOOD) {
        logLevel = 'info';
        style = 'color: blue;';
      } else {
        style = 'color: green;';
      }
    }
    
    if (metric.memory !== undefined) {
      if (metric.memory > PERFORMANCE_THRESHOLDS.MEMORY.CRITICAL) {
        logLevel = 'error';
        style = 'color: red; font-weight: bold;';
      } else if (metric.memory > PERFORMANCE_THRESHOLDS.MEMORY.WARNING) {
        logLevel = 'warn';
        style = 'color: orange; font-weight: bold;';
      }
    }
    
    if (metric.loadTime !== undefined) {
      if (metric.loadTime > PERFORMANCE_THRESHOLDS.LOAD_TIME.WARNING) {
        logLevel = 'warn';
        style = 'color: orange; font-weight: bold;';
      } else if (metric.loadTime > PERFORMANCE_THRESHOLDS.LOAD_TIME.GOOD) {
        logLevel = 'info';
        style = 'color: blue;';
      }
    }
    
    if (metric.responseTime !== undefined) {
      if (metric.responseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.WARNING) {
        logLevel = 'warn';
        style = 'color: orange; font-weight: bold;';
      } else if (metric.responseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.GOOD) {
        logLevel = 'info';
        style = 'color: blue;';
      }
    }
    
    // Create log message
    const metricType = 
      metric.fps !== undefined ? 'FPS' :
      metric.memory !== undefined ? 'Memory' :
      metric.loadTime !== undefined ? 'Load Time' :
      metric.responseTime !== undefined ? 'Response Time' : 'Unknown';
    
    const metricValue = 
      metric.fps !== undefined ? `${metric.fps} fps` :
      metric.memory !== undefined ? `${metric.memory} MB` :
      metric.loadTime !== undefined ? `${metric.loadTime.toFixed(2)} ms` :
      metric.responseTime !== undefined ? `${metric.responseTime.toFixed(2)} ms` : '';
    
    const context = metric.context || 'Performance';
    const logMessage = `[${timestamp}] [${context}] ${metricType}: ${metricValue}`;
    
    // Log with appropriate level and styling
    if (logLevel === 'error') {
      console.error(`%c${logMessage}`, style, metric.details || '');
    } else if (logLevel === 'warn') {
      console.warn(`%c${logMessage}`, style, metric.details || '');
    } else if (logLevel === 'info') {
      console.info(`%c${logMessage}`, style, metric.details || '');
    } else {
      console.log(`%c${logMessage}`, style, metric.details || '');
    }
  }
  
  logSummary() {
    if (this.metrics.length === 0) return;
    
    console.group('%c📊 Performance Summary', 'font-weight: bold; font-size: 14px; color: #9146FF;');
    
    // FPS summary
    const fpsMetrics = this.metrics.filter(m => m.fps !== undefined);
    if (fpsMetrics.length > 0) {
      const avgFps = fpsMetrics.reduce((sum, m) => sum + (m.fps || 0), 0) / fpsMetrics.length;
      const minFps = Math.min(...fpsMetrics.map(m => m.fps || 0));
      const maxFps = Math.max(...fpsMetrics.map(m => m.fps || 0));
      
      console.log(
        `%cFPS: Avg: ${avgFps.toFixed(1)} | Min: ${minFps} | Max: ${maxFps}`,
        avgFps < PERFORMANCE_THRESHOLDS.FPS.WARNING ? 'color: orange;' : 'color: green;'
      );
    }
    
    // Memory summary
    const memoryMetrics = this.metrics.filter(m => m.memory !== undefined);
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + (m.memory || 0), 0) / memoryMetrics.length;
      const maxMemory = Math.max(...memoryMetrics.map(m => m.memory || 0));
      
      console.log(
        `%cMemory: Avg: ${avgMemory.toFixed(1)} MB | Peak: ${maxMemory} MB`,
        maxMemory > PERFORMANCE_THRESHOLDS.MEMORY.WARNING ? 'color: orange;' : 'color: green;'
      );
    }
    
    // Load time summary
    const loadTimeMetrics = this.metrics.filter(m => m.loadTime !== undefined);
    if (loadTimeMetrics.length > 0) {
      const avgLoadTime = loadTimeMetrics.reduce((sum, m) => sum + (m.loadTime || 0), 0) / loadTimeMetrics.length;
      const maxLoadTime = Math.max(...loadTimeMetrics.map(m => m.loadTime || 0));
      
      console.log(
        `%cLoad Times: Avg: ${avgLoadTime.toFixed(1)} ms | Max: ${maxLoadTime.toFixed(1)} ms`,
        avgLoadTime > PERFORMANCE_THRESHOLDS.LOAD_TIME.WARNING ? 'color: orange;' : 'color: green;'
      );
    }
    
    // Response time summary
    const responseTimeMetrics = this.metrics.filter(m => m.responseTime !== undefined);
    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / responseTimeMetrics.length;
      const maxResponseTime = Math.max(...responseTimeMetrics.map(m => m.responseTime || 0));
      
      console.log(
        `%cResponse Times: Avg: ${avgResponseTime.toFixed(1)} ms | Max: ${maxResponseTime.toFixed(1)} ms`,
        avgResponseTime > PERFORMANCE_THRESHOLDS.RESPONSE_TIME.WARNING ? 'color: orange;' : 'color: green;'
      );
    }
    
    console.groupEnd();
    
    // Clear metrics after summary
    this.metrics = [];
  }
}

// Create singleton instances
const fpsTracker = new FPSTracker();
const memoryTracker = new MemoryTracker();
const loadTimeTracker = new LoadTimeTracker();
const responsivenessTracker = new ResponsivenessTracker();
const performanceLogger = new PerformanceLogger();

// Main performance monitoring service
export const performanceMonitor = {
  // Start monitoring
  start() {
    fpsTracker.start();
    memoryTracker.start();
    console.info('%c🔍 Performance monitoring started', 'color: #9146FF; font-weight: bold;');
  },
  
  // Stop monitoring
  stop() {
    fpsTracker.stop();
    memoryTracker.stop();
    performanceLogger.stopSummaryLogging();
    console.info('%c🛑 Performance monitoring stopped', 'color: #9146FF; font-weight: bold;');
  },
  
  // Get current FPS
  getFPS() {
    return fpsTracker.getFPS();
  },
  
  // Track load time for a component or resource
  trackLoadStart(id: string) {
    loadTimeTracker.startTiming(id);
  },
  
  trackLoadEnd(id: string, context?: string) {
    return loadTimeTracker.endTiming(id, context);
  },
  
  // Track UI interaction responsiveness
  trackInteractionStart(id: string) {
    responsivenessTracker.trackInteractionStart(id);
  },
  
  trackInteractionEnd(id: string) {
    return responsivenessTracker.trackInteractionEnd(id);
  },
  
  // Log a custom metric
  logMetric(metric: Omit<PerformanceMetrics, 'timestamp'>) {
    performanceLogger.logMetric({
      ...metric,
      timestamp: isBrowser ? performance.now() : Date.now()
    });
  },
  
  // Log a summary of recent metrics
  logSummary() {
    performanceLogger.logSummary();
  },
  
  // Configure summary logging interval
  configureSummaryInterval(intervalMs: number) {
    performanceLogger.startSummaryLogging(intervalMs);
  }
};

export default performanceMonitor;