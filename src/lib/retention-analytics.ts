import { supabase } from './supabase';

export interface CohortData {
  cohort_month: string;
  period_number: number;
  users_count: number;
  retained_users: number;
  retention_percentage: number;
  revenue_retained_dollars: number;
}

export interface UserRetentionSummary {
  cohort_month: string;
  total_users: number;
  active_users: number;
  churned_users: number;
  retention_percentage: number;
  avg_months_retained: number;
  total_revenue_dollars: number;
}

export interface RetentionMetrics {
  overall_retention_rate: number;
  avg_customer_lifetime_months: number;
  monthly_churn_rate: number;
  revenue_retention_rate: number;
  cohort_data: CohortData[];
  retention_summary: UserRetentionSummary[];
}

export interface LifecycleEvent {
  id: string;
  user_id: string;
  subscription_id: string;
  event_type: string;
  previous_status?: string;
  new_status?: string;
  plan_id?: string;
  amount_cents?: number;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  event_data: Record<string, any>;
  created_at: string;
}

/**
 * Initialize retention tracking for a new subscription
 */
export async function initializeUserRetentionTracking(
  userId: string,
  subscriptionId: string,
  subscriptionStartDate: Date,
  amountCents: number = 0
): Promise<void> {
  const { error } = await supabase.rpc('initialize_user_retention_tracking', {
    p_user_id: userId,
    p_subscription_id: subscriptionId,
    p_subscription_start_date: subscriptionStartDate.toISOString(),
    p_amount_cents: amountCents
  });

  if (error) {
    console.error('Error initializing user retention tracking:', error);
    throw error;
  }
}

/**
 * Update retention tracking when a subscription is cancelled
 */
export async function updateUserRetentionOnCancellation(
  userId: string,
  subscriptionId: string,
  churnReason?: string
): Promise<void> {
  const { error } = await supabase.rpc('update_user_retention_on_cancellation', {
    p_user_id: userId,
    p_subscription_id: subscriptionId,
    p_churn_reason: churnReason
  });

  if (error) {
    console.error('Error updating user retention on cancellation:', error);
    throw error;
  }
}

/**
 * Update cohort retention data (should be run periodically)
 */
export async function updateCohortRetentionData(): Promise<void> {
  const { error } = await supabase.rpc('update_cohort_retention_data');

  if (error) {
    console.error('Error updating cohort retention data:', error);
    throw error;
  }
}

/**
 * Update monthly retention metrics for active users
 */
export async function updateMonthlyRetentionMetrics(): Promise<void> {
  const { error } = await supabase.rpc('update_monthly_retention_metrics');

  if (error) {
    console.error('Error updating monthly retention metrics:', error);
    throw error;
  }
}

/**
 * Get cohort retention data
 */
export async function getCohortRetentionData(
  startDate?: Date,
  endDate?: Date
): Promise<CohortData[]> {
  let query = supabase
    .from('cohort_retention_summary')
    .select('*')
    .order('cohort_month', { ascending: false })
    .order('period_number', { ascending: true });

  if (startDate) {
    query = query.gte('cohort_month', startDate.toISOString().split('T')[0]);
  }

  if (endDate) {
    query = query.lte('cohort_month', endDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching cohort retention data:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get user retention summary by cohort
 */
export async function getUserRetentionSummary(
  startDate?: Date,
  endDate?: Date
): Promise<UserRetentionSummary[]> {
  let query = supabase
    .from('user_retention_summary')
    .select('*')
    .order('cohort_month', { ascending: false });

  if (startDate) {
    query = query.gte('cohort_month', startDate.toISOString().split('T')[0]);
  }

  if (endDate) {
    query = query.lte('cohort_month', endDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user retention summary:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get comprehensive retention metrics
 */
export async function getRetentionMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<RetentionMetrics> {
  try {
    // Fetch cohort data and retention summary in parallel
    const [cohortData, retentionSummary] = await Promise.all([
      getCohortRetentionData(startDate, endDate),
      getUserRetentionSummary(startDate, endDate)
    ]);

    // Calculate overall metrics
    const totalUsers = retentionSummary.reduce((sum, cohort) => sum + cohort.total_users, 0);
    const activeUsers = retentionSummary.reduce((sum, cohort) => sum + cohort.active_users, 0);
    const totalRevenue = retentionSummary.reduce((sum, cohort) => sum + cohort.total_revenue_dollars, 0);
    const activeRevenue = cohortData
      .filter(c => c.period_number === 0)
      .reduce((sum, cohort) => sum + cohort.revenue_retained_dollars, 0);

    const overallRetentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const monthlyChurnRate = 100 - overallRetentionRate;
    const revenueRetentionRate = totalRevenue > 0 ? (activeRevenue / totalRevenue) * 100 : 0;
    
    // Calculate average customer lifetime
    const avgCustomerLifetimeMonths = retentionSummary.length > 0
      ? retentionSummary.reduce((sum, cohort) => sum + (cohort.avg_months_retained || 0), 0) / retentionSummary.length
      : 0;

    return {
      overall_retention_rate: Math.round(overallRetentionRate * 100) / 100,
      avg_customer_lifetime_months: Math.round(avgCustomerLifetimeMonths * 100) / 100,
      monthly_churn_rate: Math.round(monthlyChurnRate * 100) / 100,
      revenue_retention_rate: Math.round(revenueRetentionRate * 100) / 100,
      cohort_data: cohortData,
      retention_summary: retentionSummary
    };
  } catch (error) {
    console.error('Error fetching retention metrics:', error);
    throw error;
  }
}

/**
 * Get subscription lifecycle events for a user
 */
export async function getUserLifecycleEvents(
  userId: string,
  limit: number = 50
): Promise<LifecycleEvent[]> {
  const { data, error } = await supabase
    .from('subscription_lifecycle_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user lifecycle events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get recent lifecycle events across all users
 */
export async function getRecentLifecycleEvents(
  eventTypes?: string[],
  limit: number = 100
): Promise<LifecycleEvent[]> {
  let query = supabase
    .from('subscription_lifecycle_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (eventTypes && eventTypes.length > 0) {
    query = query.in('event_type', eventTypes);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recent lifecycle events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Track a custom lifecycle event
 */
export async function trackLifecycleEvent(
  userId: string,
  subscriptionId: string,
  eventType: string,
  eventData: {
    previousStatus?: string;
    newStatus?: string;
    planId?: string;
    amountCents?: number;
    billingCycleStart?: Date;
    billingCycleEnd?: Date;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  const { error } = await supabase
    .from('subscription_lifecycle_events')
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      event_type: eventType,
      previous_status: eventData.previousStatus,
      new_status: eventData.newStatus,
      plan_id: eventData.planId,
      amount_cents: eventData.amountCents,
      billing_cycle_start: eventData.billingCycleStart?.toISOString().split('T')[0],
      billing_cycle_end: eventData.billingCycleEnd?.toISOString().split('T')[0],
      event_data: eventData.metadata || {}
    });

  if (error) {
    console.error('Error tracking lifecycle event:', error);
    throw error;
  }
}

/**
 * Get churn analysis data
 */
export async function getChurnAnalysis(
  startDate?: Date,
  endDate?: Date
): Promise<{
  churn_reasons: { reason: string; count: number; percentage: number }[];
  churn_by_month: { month: string; churned_users: number; churn_rate: number }[];
  avg_time_to_churn_days: number;
}> {
  try {
    // Build date filter
    let dateFilter = '';
    const params: any = {};
    
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) {
        conditions.push('churn_date >= $1');
        params['1'] = startDate.toISOString();
      }
      if (endDate) {
        conditions.push('churn_date <= $2');
        params['2'] = endDate.toISOString();
      }
      dateFilter = 'WHERE ' + conditions.join(' AND ');
    }

    // Get churn reasons
    const { data: churnReasons, error: churnReasonsError } = await supabase.rpc('get_churn_reasons', params);
    
    if (churnReasonsError) {
      console.error('Error fetching churn reasons:', churnReasonsError);
    }

    // Get churn by month
    const { data: churnByMonth, error: churnByMonthError } = await supabase.rpc('get_churn_by_month', params);
    
    if (churnByMonthError) {
      console.error('Error fetching churn by month:', churnByMonthError);
    }

    // Calculate average time to churn
    const { data: avgTimeToChurn, error: avgTimeError } = await supabase
      .from('user_retention_tracking')
      .select('subscription_start_date, churn_date')
      .not('churn_date', 'is', null);

    let avgTimeToChurnDays = 0;
    if (!avgTimeError && avgTimeToChurn && avgTimeToChurn.length > 0) {
      const totalDays = avgTimeToChurn.reduce((sum, record) => {
        const startDate = new Date(record.subscription_start_date);
        const churnDate = new Date(record.churn_date!);
        const diffTime = Math.abs(churnDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      avgTimeToChurnDays = Math.round(totalDays / avgTimeToChurn.length);
    }

    return {
      churn_reasons: churnReasons || [],
      churn_by_month: churnByMonth || [],
      avg_time_to_churn_days: avgTimeToChurnDays
    };
  } catch (error) {
    console.error('Error fetching churn analysis:', error);
    throw error;
  }
}