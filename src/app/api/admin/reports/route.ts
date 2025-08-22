import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/auth';
import { supabase } from '@/lib/supabase';

interface ReportParams {
  type: 'subscription' | 'revenue' | 'retention' | 'conversion' | 'comprehensive';
  format: 'csv' | 'json';
  start_date: string;
  end_date: string;
  include_details?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'comprehensive';
    const format = searchParams.get('format') || 'json';
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const includeDetails = searchParams.get('include_details') === 'true';

    let reportData: any = {};

    // Generate report based on type
    switch (reportType) {
      case 'subscription':
        reportData = await generateSubscriptionReport(startDate, endDate, includeDetails);
        break;
      case 'revenue':
        reportData = await generateRevenueReport(startDate, endDate, includeDetails);
        break;
      case 'retention':
        reportData = await generateRetentionReport(startDate, endDate, includeDetails);
        break;
      case 'conversion':
        reportData = await generateConversionReport(startDate, endDate, includeDetails);
        break;
      case 'comprehensive':
        reportData = await generateComprehensiveReport(startDate, endDate, includeDetails);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Format response based on requested format
    if (format === 'csv') {
      const csv = convertToCSV(reportData, reportType);
      const filename = `${reportType}_report_${startDate}_to_${endDate}.csv`;
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      report_type: reportType,
      date_range: { start_date: startDate, end_date: endDate },
      generated_at: new Date().toISOString(),
      data: reportData
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateSubscriptionReport(startDate: string, endDate: string, includeDetails: boolean) {
  // Fetch subscription metrics
  const { data: subscriptionEvents } = await supabase
    .from('subscription_events')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false });

  const { data: dailyMetrics } = await supabase
    .from('subscription_metrics_daily')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  // Calculate summary metrics
  const totalSubscriptions = subscriptionEvents?.filter(e => e.event_type === 'subscription_created').length || 0;
  const totalCancellations = subscriptionEvents?.filter(e => e.event_type === 'subscription_cancelled').length || 0;
  const netSubscriptions = totalSubscriptions - totalCancellations;
  
  const totalRevenue = subscriptionEvents?.reduce((sum, event) => {
    return sum + (event.amount_cents || 0);
  }, 0) || 0;

  const report = {
    summary: {
      total_subscriptions: totalSubscriptions,
      total_cancellations: totalCancellations,
      net_subscriptions: netSubscriptions,
      total_revenue_cents: totalRevenue,
      total_revenue_dollars: totalRevenue / 100,
      churn_rate: totalSubscriptions > 0 ? (totalCancellations / totalSubscriptions * 100) : 0
    },
    daily_metrics: dailyMetrics || [],
  };

  if (includeDetails) {
    (report as any).events = subscriptionEvents || [];
  }

  return report;
}

async function generateRevenueReport(startDate: string, endDate: string, includeDetails: boolean) {
  // Fetch payment events
  const { data: paymentEvents } = await supabase
    .from('payment_events')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false });

  // Calculate revenue metrics
  const successfulPayments = paymentEvents?.filter(e => e.event_type === 'payment_succeeded') || [];
  const failedPayments = paymentEvents?.filter(e => e.event_type === 'payment_failed') || [];
  
  const totalRevenue = successfulPayments.reduce((sum, payment) => sum + ((payment.amount_cents as number) || 0), 0);
  const averageTransactionValue = successfulPayments.length > 0 ? totalRevenue / successfulPayments.length : 0;
  
  // Group by day for trend analysis
  const dailyRevenue = successfulPayments.reduce((acc, payment) => {
    const date = payment.created_at.split('T')[0];
    const amount = payment.amount_cents as number || 0;
    acc[date] = (acc[date] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const report = {
    summary: {
      total_revenue_cents: totalRevenue,
      total_revenue_dollars: totalRevenue / 100,
      successful_payments: successfulPayments.length,
      failed_payments: failedPayments.length,
      success_rate: (successfulPayments.length + failedPayments.length) > 0 
        ? (successfulPayments.length / (successfulPayments.length + failedPayments.length) * 100) 
        : 0,
      average_transaction_value_cents: averageTransactionValue,
      average_transaction_value_dollars: averageTransactionValue / 100
    },
    daily_revenue: Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      revenue_cents: amount,
      revenue_dollars: amount / 100
    })).sort((a, b) => a.date.localeCompare(b.date))
  };

  if (includeDetails) {
    (report as any).events = paymentEvents || [];
  }

  return report;
}

async function generateRetentionReport(startDate: string, endDate: string, includeDetails: boolean) {
  // This would use the retention analytics functions we created
  // For now, return a placeholder structure
  const report = {
    summary: {
      overall_retention_rate: 0,
      avg_customer_lifetime_months: 0,
      monthly_churn_rate: 0,
      revenue_retention_rate: 0
    },
    cohort_analysis: [],
    churn_analysis: {
      avg_time_to_churn_days: 0,
      churn_reasons: [],
      churn_by_month: []
    }
  };

  // TODO: Implement actual retention data fetching once database migration is run
  return report;
}

async function generateConversionReport(startDate: string, endDate: string, includeDetails: boolean) {
  // Fetch conversion funnel events
  const { data: conversionEvents } = await supabase
    .from('conversion_funnel_events')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')
    .order('created_at', { ascending: false });

  // Calculate funnel metrics
  const eventCounts = conversionEvents?.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const landingPage = eventCounts['landing_page'] || 0;
  const viewPricing = eventCounts['view_pricing'] || 0;
  const startCheckout = eventCounts['start_checkout'] || 0;
  const paymentInfo = eventCounts['payment_info'] || 0;
  const completePurchase = eventCounts['complete_purchase'] || 0;
  const abandonedCheckout = eventCounts['abandoned_checkout'] || 0;

  const report = {
    summary: {
      total_funnel_entries: landingPage,
      total_conversions: completePurchase,
      overall_conversion_rate: landingPage > 0 ? (completePurchase / landingPage * 100) : 0,
      abandonment_rate: startCheckout > 0 ? (abandonedCheckout / startCheckout * 100) : 0
    },
    funnel_steps: {
      landing_page: landingPage,
      view_pricing: viewPricing,
      start_checkout: startCheckout,
      payment_info: paymentInfo,
      complete_purchase: completePurchase,
      abandoned_checkout: abandonedCheckout
    },
    conversion_rates: {
      landing_to_pricing: landingPage > 0 ? (viewPricing / landingPage * 100) : 0,
      pricing_to_checkout: viewPricing > 0 ? (startCheckout / viewPricing * 100) : 0,
      checkout_to_payment: startCheckout > 0 ? (paymentInfo / startCheckout * 100) : 0,
      payment_to_purchase: paymentInfo > 0 ? (completePurchase / paymentInfo * 100) : 0
    }
  };

  if (includeDetails) {
    (report as any).events = conversionEvents || [];
  }

  return report;
}

async function generateComprehensiveReport(startDate: string, endDate: string, includeDetails: boolean) {
  const [subscriptionReport, revenueReport, retentionReport, conversionReport] = await Promise.all([
    generateSubscriptionReport(startDate, endDate, false),
    generateRevenueReport(startDate, endDate, false),
    generateRetentionReport(startDate, endDate, false),
    generateConversionReport(startDate, endDate, false)
  ]);

  return {
    subscription_metrics: subscriptionReport,
    revenue_metrics: revenueReport,
    retention_metrics: retentionReport,
    conversion_metrics: conversionReport
  };
}

function convertToCSV(data: any, reportType: string): string {
  let csv = '';
  
  switch (reportType) {
    case 'subscription':
      csv = convertSubscriptionToCSV(data);
      break;
    case 'revenue':
      csv = convertRevenueToCSV(data);
      break;
    case 'conversion':
      csv = convertConversionToCSV(data);
      break;
    case 'comprehensive':
      csv = convertComprehensiveToCSV(data);
      break;
    default:
      csv = 'Report Type,Data\n' + reportType + ',"' + JSON.stringify(data).replace(/"/g, '""') + '"';
  }
  
  return csv;
}

function convertSubscriptionToCSV(data: any): string {
  let csv = 'Subscription Report Summary\n';
  csv += 'Metric,Value\n';
  csv += `Total Subscriptions,${data.summary.total_subscriptions}\n`;
  csv += `Total Cancellations,${data.summary.total_cancellations}\n`;
  csv += `Net Subscriptions,${data.summary.net_subscriptions}\n`;
  csv += `Total Revenue,$${data.summary.total_revenue_dollars.toFixed(2)}\n`;
  csv += `Churn Rate,${data.summary.churn_rate.toFixed(2)}%\n\n`;
  
  if (data.daily_metrics && data.daily_metrics.length > 0) {
    csv += 'Daily Metrics\n';
    csv += 'Date,New Subscriptions,Cancellations,Net Change,Revenue\n';
    data.daily_metrics.forEach((metric: any) => {
      csv += `${metric.date},${metric.new_subscriptions || 0},${metric.cancelled_subscriptions || 0},${metric.net_subscriptions || 0},$${((metric.total_revenue || 0) / 100).toFixed(2)}\n`;
    });
  }
  
  return csv;
}

function convertRevenueToCSV(data: any): string {
  let csv = 'Revenue Report Summary\n';
  csv += 'Metric,Value\n';
  csv += `Total Revenue,$${data.summary.total_revenue_dollars.toFixed(2)}\n`;
  csv += `Successful Payments,${data.summary.successful_payments}\n`;
  csv += `Failed Payments,${data.summary.failed_payments}\n`;
  csv += `Success Rate,${data.summary.success_rate.toFixed(2)}%\n`;
  csv += `Average Transaction Value,$${data.summary.average_transaction_value_dollars.toFixed(2)}\n\n`;
  
  if (data.daily_revenue && data.daily_revenue.length > 0) {
    csv += 'Daily Revenue\n';
    csv += 'Date,Revenue\n';
    data.daily_revenue.forEach((day: any) => {
      csv += `${day.date},$${day.revenue_dollars.toFixed(2)}\n`;
    });
  }
  
  return csv;
}

function convertConversionToCSV(data: any): string {
  let csv = 'Conversion Report Summary\n';
  csv += 'Metric,Value\n';
  csv += `Total Funnel Entries,${data.summary.total_funnel_entries}\n`;
  csv += `Total Conversions,${data.summary.total_conversions}\n`;
  csv += `Overall Conversion Rate,${data.summary.overall_conversion_rate.toFixed(2)}%\n`;
  csv += `Abandonment Rate,${data.summary.abandonment_rate.toFixed(2)}%\n\n`;
  
  csv += 'Funnel Steps\n';
  csv += 'Step,Count\n';
  Object.entries(data.funnel_steps).forEach(([step, count]) => {
    csv += `${step.replace(/_/g, ' ')},${count}\n`;
  });
  
  csv += '\nConversion Rates\n';
  csv += 'Transition,Rate\n';
  Object.entries(data.conversion_rates).forEach(([transition, rate]) => {
    csv += `${transition.replace(/_/g, ' ')},${(rate as number).toFixed(2)}%\n`;
  });
  
  return csv;
}

function convertComprehensiveToCSV(data: any): string {
  let csv = 'Comprehensive Report\n\n';
  
  // Add each report section
  csv += convertSubscriptionToCSV(data.subscription_metrics) + '\n\n';
  csv += convertRevenueToCSV(data.revenue_metrics) + '\n\n';
  csv += convertConversionToCSV(data.conversion_metrics) + '\n\n';
  
  return csv;
}