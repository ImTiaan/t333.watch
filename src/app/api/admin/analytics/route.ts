import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/auth';
import { supabase } from '@/lib/supabase';
import { getRetentionMetrics, getChurnAnalysis } from '@/lib/retention-analytics';

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await requireAdmin(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end_date') || new Date().toISOString();

    // Get subscription metrics
    const { data: subscriptionEvents, error: subError } = await supabase
      .from('subscription_events')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (subError) {
      console.error('Error fetching subscription events:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription events' }, { status: 500 });
    }

    // Get payment events
    const { data: paymentEvents, error: payError } = await supabase
      .from('payment_events')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (payError) {
      console.error('Error fetching payment events:', payError);
      return NextResponse.json({ error: 'Failed to fetch payment events' }, { status: 500 });
    }

    // Get conversion funnel events
    const { data: conversionEvents, error: convError } = await supabase
      .from('conversion_funnel_events')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversion funnel events:', convError);
      return NextResponse.json({ error: 'Failed to fetch conversion funnel events' }, { status: 500 });
    }

    // Calculate metrics
    const totalSubscriptions = subscriptionEvents?.filter(e => e.event_type === 'subscription_created').length || 0;
    const totalCancellations = subscriptionEvents?.filter(e => e.event_type === 'subscription_cancelled').length || 0;
    const totalRevenue = paymentEvents?.reduce((sum, event) => {
      return sum + (event.amount || 0);
    }, 0) || 0;

    const churnRate = totalSubscriptions > 0 ? (totalCancellations / totalSubscriptions) * 100 : 0;
    
    // Calculate conversion funnel metrics
    const funnelSteps = {
      landing_page: conversionEvents?.filter(e => e.funnel_step === 'landing_page').length || 0,
      view_pricing: conversionEvents?.filter(e => e.funnel_step === 'view_pricing').length || 0,
      start_checkout: conversionEvents?.filter(e => e.funnel_step === 'start_checkout').length || 0,
      payment_info: conversionEvents?.filter(e => e.funnel_step === 'payment_info').length || 0,
      complete_purchase: conversionEvents?.filter(e => e.funnel_step === 'complete_purchase').length || 0,
      abandoned_checkout: conversionEvents?.filter(e => e.funnel_step === 'abandoned_checkout').length || 0
    };
    
    const conversionRates = {
      landing_to_pricing: funnelSteps.landing_page > 0 ? 
        (funnelSteps.view_pricing / funnelSteps.landing_page) * 100 : 0,
      pricing_to_checkout: funnelSteps.view_pricing > 0 ? 
        (funnelSteps.start_checkout / funnelSteps.view_pricing) * 100 : 0,
      checkout_to_payment: funnelSteps.start_checkout > 0 ? 
        (funnelSteps.payment_info / funnelSteps.start_checkout) * 100 : 0,
      payment_to_purchase: funnelSteps.payment_info > 0 ? 
        (funnelSteps.complete_purchase / funnelSteps.payment_info) * 100 : 0,
      overall_conversion: funnelSteps.landing_page > 0 ? 
        (funnelSteps.complete_purchase / funnelSteps.landing_page) * 100 : 0
    };
    
    const conversionRate = conversionRates.overall_conversion;

    // Get active subscribers count
    const { data: activeSubscribers, error: activeError } = await supabase
      .from('users')
      .select('id')
      .eq('premium_flag', true);

    if (activeError) {
      console.error('Error fetching active subscribers:', activeError);
    }

    // Get retention metrics
    let retentionMetrics = null;
    let churnAnalysis = null;
    try {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      [retentionMetrics, churnAnalysis] = await Promise.all([
        getRetentionMetrics(startDateObj, endDateObj),
        getChurnAnalysis(startDateObj, endDateObj)
      ]);
    } catch (error) {
      console.error('Error fetching retention metrics:', error);
    }

    const analytics = {
      overview: {
        totalSubscriptions,
        totalCancellations,
        activeSubscribers: activeSubscribers?.length || 0,
        totalRevenue: totalRevenue / 100, // Convert from cents to dollars
        churnRate: Math.round(churnRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      funnel: {
        steps: funnelSteps,
        conversionRates: {
          landing_to_pricing: Math.round(conversionRates.landing_to_pricing * 100) / 100,
          pricing_to_checkout: Math.round(conversionRates.pricing_to_checkout * 100) / 100,
          checkout_to_payment: Math.round(conversionRates.checkout_to_payment * 100) / 100,
          payment_to_purchase: Math.round(conversionRates.payment_to_purchase * 100) / 100,
          overall_conversion: Math.round(conversionRates.overall_conversion * 100) / 100
        },
        abandonmentRate: funnelSteps.start_checkout > 0 ? 
          Math.round((funnelSteps.abandoned_checkout / funnelSteps.start_checkout) * 10000) / 100 : 0
      },
      retention: retentionMetrics ? {
        overall_retention_rate: retentionMetrics.overall_retention_rate,
        avg_customer_lifetime_months: retentionMetrics.avg_customer_lifetime_months,
        monthly_churn_rate: retentionMetrics.monthly_churn_rate,
        revenue_retention_rate: retentionMetrics.revenue_retention_rate,
        cohort_summary: retentionMetrics.retention_summary.slice(0, 6), // Last 6 months
        churn_analysis: churnAnalysis
      } : null,
      events: {
        subscriptions: subscriptionEvents || [],
        payments: paymentEvents || [],
        conversions: conversionEvents || []
      },
      dateRange: {
        startDate,
        endDate
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error in admin analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}