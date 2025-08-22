import { useState, useEffect, useCallback } from 'react';
import {
  getRetentionMetrics,
  getCohortRetentionData,
  getUserRetentionSummary,
  getChurnAnalysis,
  getRecentLifecycleEvents,
  getUserLifecycleEvents,
  updateCohortRetentionData,
  updateMonthlyRetentionMetrics,
  type RetentionMetrics,
  type CohortData,
  type UserRetentionSummary,
  type LifecycleEvent
} from '../lib/retention-analytics';

export interface UseRetentionAnalyticsOptions {
  startDate?: Date;
  endDate?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseRetentionAnalyticsReturn {
  // Data
  retentionMetrics: RetentionMetrics | null;
  cohortData: CohortData[];
  retentionSummary: UserRetentionSummary[];
  recentEvents: LifecycleEvent[];
  churnAnalysis: {
    churn_reasons: { reason: string; count: number; percentage: number }[];
    churn_by_month: { month: string; churned_users: number; churn_rate: number }[];
    avg_time_to_churn_days: number;
  } | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  updateRetentionData: () => Promise<void>;
  setDateRange: (startDate?: Date, endDate?: Date) => void;
}

export function useRetentionAnalytics(options: UseRetentionAnalyticsOptions = {}): UseRetentionAnalyticsReturn {
  const {
    startDate: initialStartDate,
    endDate: initialEndDate,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  // State
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [retentionSummary, setRetentionSummary] = useState<UserRetentionSummary[]>([]);
  const [recentEvents, setRecentEvents] = useState<LifecycleEvent[]>([]);
  const [churnAnalysis, setChurnAnalysis] = useState<{
    churn_reasons: { reason: string; count: number; percentage: number }[];
    churn_by_month: { month: string; churned_users: number; churn_rate: number }[];
    avg_time_to_churn_days: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);

  // Fetch all retention data
  const fetchRetentionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [metrics, cohorts, summary, events, churn] = await Promise.all([
        getRetentionMetrics(startDate, endDate),
        getCohortRetentionData(startDate, endDate),
        getUserRetentionSummary(startDate, endDate),
        getRecentLifecycleEvents(undefined, 50),
        getChurnAnalysis(startDate, endDate)
      ]);

      setRetentionMetrics(metrics);
      setCohortData(cohorts);
      setRetentionSummary(summary);
      setRecentEvents(events);
      setChurnAnalysis(churn);
    } catch (err) {
      console.error('Error fetching retention data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch retention data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Update retention data (recalculate cohorts and metrics)
  const updateRetentionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Update cohort data and monthly metrics
      await Promise.all([
        updateCohortRetentionData(),
        updateMonthlyRetentionMetrics()
      ]);

      // Refresh the data after updating
      await fetchRetentionData();
    } catch (err) {
      console.error('Error updating retention data:', err);
      setError(err instanceof Error ? err.message : 'Failed to update retention data');
      setLoading(false);
    }
  }, [fetchRetentionData]);

  // Set date range
  const setDateRange = useCallback((newStartDate?: Date, newEndDate?: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    await fetchRetentionData();
  }, [fetchRetentionData]);

  // Initial data fetch
  useEffect(() => {
    fetchRetentionData();
  }, [fetchRetentionData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchRetentionData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchRetentionData]);

  return {
    // Data
    retentionMetrics,
    cohortData,
    retentionSummary,
    recentEvents,
    churnAnalysis,
    
    // State
    loading,
    error,
    
    // Actions
    refreshData,
    updateRetentionData,
    setDateRange
  };
}

export interface UseUserRetentionOptions {
  userId: string;
  limit?: number;
}

export interface UseUserRetentionReturn {
  lifecycleEvents: LifecycleEvent[];
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
}

/**
 * Hook for fetching retention data for a specific user
 */
export function useUserRetention(options: UseUserRetentionOptions): UseUserRetentionReturn {
  const { userId, limit = 50 } = options;
  
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const events = await getUserLifecycleEvents(userId, limit);
      setLifecycleEvents(events);
    } catch (err) {
      console.error('Error fetching user lifecycle events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user events');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  const refreshEvents = useCallback(async () => {
    await fetchUserEvents();
  }, [fetchUserEvents]);

  useEffect(() => {
    if (userId) {
      fetchUserEvents();
    }
  }, [fetchUserEvents, userId]);

  return {
    lifecycleEvents,
    loading,
    error,
    refreshEvents
  };
}

export interface UseCohortAnalysisOptions {
  cohortMonth?: string;
  maxPeriods?: number;
}

export interface UseCohortAnalysisReturn {
  cohortData: CohortData[];
  cohortMatrix: number[][];
  cohortLabels: string[];
  periodLabels: string[];
  loading: boolean;
  error: string | null;
  refreshCohortData: () => Promise<void>;
}

/**
 * Hook for cohort analysis with matrix data for visualization
 */
export function useCohortAnalysis(options: UseCohortAnalysisOptions = {}): UseCohortAnalysisReturn {
  const { cohortMonth, maxPeriods = 12 } = options;
  
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [cohortMatrix, setCohortMatrix] = useState<number[][]>([]);
  const [cohortLabels, setCohortLabels] = useState<string[]>([]);
  const [periodLabels, setPeriodLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCohortData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCohortRetentionData();
      
      // Filter by cohort month if specified
      const filteredData = cohortMonth 
        ? data.filter(d => d.cohort_month === cohortMonth)
        : data;
      
      setCohortData(filteredData);
      
      // Build cohort matrix for heatmap visualization
      const cohorts = [...new Set(filteredData.map(d => d.cohort_month))].sort();
      const periods = Array.from({ length: maxPeriods + 1 }, (_, i) => i);
      
      const matrix = cohorts.map(cohort => {
        return periods.map(period => {
          const cohortPeriodData = filteredData.find(
            d => d.cohort_month === cohort && d.period_number === period
          );
          return cohortPeriodData ? cohortPeriodData.retention_percentage : 0;
        });
      });
      
      setCohortMatrix(matrix);
      setCohortLabels(cohorts);
      setPeriodLabels(periods.map(p => `Month ${p}`));
    } catch (err) {
      console.error('Error fetching cohort data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cohort data');
    } finally {
      setLoading(false);
    }
  }, [cohortMonth, maxPeriods]);

  const refreshCohortData = useCallback(async () => {
    await fetchCohortData();
  }, [fetchCohortData]);

  useEffect(() => {
    fetchCohortData();
  }, [fetchCohortData]);

  return {
    cohortData,
    cohortMatrix,
    cohortLabels,
    periodLabels,
    loading,
    error,
    refreshCohortData
  };
}