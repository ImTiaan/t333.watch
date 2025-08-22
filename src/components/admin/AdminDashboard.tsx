'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReportsPanel from './ReportsPanel';
// Simple SVG icons to replace lucide-react
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DollarSignIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

interface AnalyticsData {
  overview: {
    totalSubscriptions: number;
    totalCancellations: number;
    activeSubscribers: number;
    totalRevenue: number;
    churnRate: number;
    conversionRate: number;
  };
  funnel: {
    steps: {
      landing_page: number;
      view_pricing: number;
      start_checkout: number;
      payment_info: number;
      complete_purchase: number;
      abandoned_checkout: number;
    };
    conversionRates: {
      landing_to_pricing: number;
      pricing_to_checkout: number;
      checkout_to_payment: number;
      payment_to_purchase: number;
      overall_conversion: number;
    };
    abandonmentRate: number;
  };
  retention?: {
    overall_retention_rate: number;
    avg_customer_lifetime_months: number;
    monthly_churn_rate: number;
    revenue_retention_rate: number;
    cohort_summary: {
      cohort_month: string;
      total_users: number;
      active_users: number;
      churned_users: number;
      retention_percentage: number;
      avg_months_retained: number;
      total_revenue_dollars: number;
    }[];
    churn_analysis: {
      churn_reasons: { reason: string; count: number; percentage: number }[];
      churn_by_month: { month: string; churned_users: number; churn_rate: number }[];
      avg_time_to_churn_days: number;
    };
  };
  events: {
    subscriptions: any[];
    payments: any[];
    conversions: any[];
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      const response = await fetch(`/api/admin/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDateRangeChange = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">No data available</div>
      </div>
    );
  }

  const { overview, funnel, retention } = analytics;

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="bg-[#1f1f23] rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <label className="text-sm text-gray-400">Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-[#0e0e10] text-white px-3 py-1 rounded border border-gray-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-[#0e0e10] text-white px-3 py-1 rounded border border-gray-600"
            />
          </div>
          <Button onClick={handleDateRangeChange} className="bg-purple-600 hover:bg-purple-700">
            Update
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-[#1f1f23] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Subscribers</CardTitle>
            <UsersIcon className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview.activeSubscribers}</div>
            <p className="text-xs text-gray-400 mt-1">
              {overview.totalSubscriptions} total subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1f1f23] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${overview.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">
              From {analytics.events.payments.length} payments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1f1f23] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Churn Rate</CardTitle>
            <TrendingDownIcon className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview.churnRate}%</div>
            <p className="text-xs text-gray-400 mt-1">
              {overview.totalCancellations} cancellations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1f1f23] border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Conversion Rate</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview.conversionRate}%</div>
            <p className="text-xs text-gray-400 mt-1">
              From plan views to subscriptions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Conversion Funnel Analytics</h2>
        
        {/* Funnel Steps */}
        <Card className="bg-[#1f1f23] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Conversion Funnel Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Landing Page */}
              <div className="flex items-center justify-between p-4 bg-[#0e0e10] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <div>
                    <div className="text-white font-medium">Landing Page</div>
                    <div className="text-gray-400 text-sm">Initial page visits</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{funnel.steps.landing_page}</div>
                  <div className="text-gray-400 text-sm">visitors</div>
                </div>
              </div>
              
              {/* View Pricing */}
              <div className="flex items-center justify-between p-4 bg-[#0e0e10] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <div>
                    <div className="text-white font-medium">View Pricing</div>
                    <div className="text-gray-400 text-sm">Pricing page views</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{funnel.steps.view_pricing}</div>
                  <div className="text-green-400 text-sm">{funnel.conversionRates.landing_to_pricing}% conversion</div>
                </div>
              </div>
              
              {/* Start Checkout */}
              <div className="flex items-center justify-between p-4 bg-[#0e0e10] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <div>
                    <div className="text-white font-medium">Start Checkout</div>
                    <div className="text-gray-400 text-sm">Checkout initiated</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{funnel.steps.start_checkout}</div>
                  <div className="text-green-400 text-sm">{funnel.conversionRates.pricing_to_checkout}% conversion</div>
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="flex items-center justify-between p-4 bg-[#0e0e10] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                  <div>
                    <div className="text-white font-medium">Payment Info</div>
                    <div className="text-gray-400 text-sm">Payment details entered</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{funnel.steps.payment_info}</div>
                  <div className="text-green-400 text-sm">{funnel.conversionRates.checkout_to_payment}% conversion</div>
                </div>
              </div>
              
              {/* Complete Purchase */}
              <div className="flex items-center justify-between p-4 bg-[#0e0e10] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
                  <div>
                    <div className="text-white font-medium">Complete Purchase</div>
                    <div className="text-gray-400 text-sm">Successful subscriptions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{funnel.steps.complete_purchase}</div>
                  <div className="text-green-400 text-sm">{funnel.conversionRates.payment_to_purchase}% conversion</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Funnel Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#1f1f23] border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Overall Conversion</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{funnel.conversionRates.overall_conversion}%</div>
              <p className="text-xs text-gray-400 mt-1">
                Landing to purchase conversion
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1f1f23] border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Checkout Abandonment</CardTitle>
              <TrendingDownIcon className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{funnel.abandonmentRate}%</div>
              <p className="text-xs text-gray-400 mt-1">
                {funnel.steps.abandoned_checkout} abandoned checkouts
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1f1f23] border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Best Converting Step</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {Math.max(
                  funnel.conversionRates.landing_to_pricing,
                  funnel.conversionRates.pricing_to_checkout,
                  funnel.conversionRates.checkout_to_payment,
                  funnel.conversionRates.payment_to_purchase
                ).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Highest step conversion rate
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Retention Analytics */}
      {retention && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Retention Analytics</h2>
          
          {/* Retention Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#1f1f23] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Overall Retention</CardTitle>
                <TrendingUpIcon className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{retention.overall_retention_rate.toFixed(1)}%</div>
                <p className="text-xs text-gray-400 mt-1">Customer retention rate</p>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1f1f23] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg Lifetime</CardTitle>
                <CalendarIcon className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{retention.avg_customer_lifetime_months.toFixed(1)}</div>
                <p className="text-xs text-gray-400 mt-1">months per customer</p>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1f1f23] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Monthly Churn</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{retention.monthly_churn_rate.toFixed(1)}%</div>
                <p className="text-xs text-gray-400 mt-1">monthly churn rate</p>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1f1f23] border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Revenue Retention</CardTitle>
                <DollarSignIcon className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{retention.revenue_retention_rate.toFixed(1)}%</div>
                <p className="text-xs text-gray-400 mt-1">revenue retained</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Cohort Analysis */}
          <Card className="bg-[#1f1f23] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Cohort Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 py-2">Cohort Month</th>
                      <th className="text-right text-gray-400 py-2">Total Users</th>
                      <th className="text-right text-gray-400 py-2">Active Users</th>
                      <th className="text-right text-gray-400 py-2">Retention %</th>
                      <th className="text-right text-gray-400 py-2">Avg Months</th>
                      <th className="text-right text-gray-400 py-2">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retention.cohort_summary.slice(0, 10).map((cohort, index) => (
                      <tr key={index} className="border-b border-gray-800">
                        <td className="text-white py-2">{cohort.cohort_month}</td>
                        <td className="text-right text-white py-2">{cohort.total_users}</td>
                        <td className="text-right text-white py-2">{cohort.active_users}</td>
                        <td className="text-right text-green-400 py-2">{cohort.retention_percentage.toFixed(1)}%</td>
                        <td className="text-right text-blue-400 py-2">{cohort.avg_months_retained.toFixed(1)}</td>
                        <td className="text-right text-green-400 py-2">${cohort.total_revenue_dollars.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {retention.cohort_summary.length === 0 && (
                  <div className="text-gray-400 text-center py-4">No cohort data available</div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Churn Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1f1f23] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Churn Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Average Time to Churn</div>
                    <div className="text-2xl font-bold text-white">{retention.churn_analysis.avg_time_to_churn_days} days</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Top Churn Reasons</div>
                    <div className="space-y-2">
                      {retention.churn_analysis.churn_reasons.slice(0, 5).map((reason, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-white text-sm">{reason.reason}</span>
                          <span className="text-gray-400 text-sm">{reason.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1f1f23] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Monthly Churn Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {retention.churn_analysis.churn_by_month.slice(0, 12).map((month, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-800">
                      <div>
                        <div className="text-sm text-white">{month.month}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-red-400">{month.churned_users} users</div>
                        <div className="text-xs text-gray-400">{month.churn_rate.toFixed(1)}% rate</div>
                      </div>
                    </div>
                  ))}
                  {retention.churn_analysis.churn_by_month.length === 0 && (
                    <div className="text-gray-400 text-center py-4">No churn data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1f1f23] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Subscription Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.events.subscriptions.slice(0, 10).map((event, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                  <div>
                    <div className="text-sm text-white">{event.event_type}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-300">
                    {event.plan_name || 'N/A'}
                  </div>
                </div>
              ))}
              {analytics.events.subscriptions.length === 0 && (
                <div className="text-gray-400 text-center py-4">No subscription events</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1f1f23] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Payment Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.events.payments.slice(0, 10).map((event, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                  <div>
                    <div className="text-sm text-white">{event.event_type}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-green-400">
                    ${((event.amount || 0) / 100).toFixed(2)}
                  </div>
                </div>
              ))}
              {analytics.events.payments.length === 0 && (
                <div className="text-gray-400 text-center py-4">No payment events</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Panel */}
      <div className="mt-8">
        <ReportsPanel />
      </div>
    </div>
  );
}