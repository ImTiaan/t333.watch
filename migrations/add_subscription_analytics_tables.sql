-- Add subscription analytics tables for admin dashboard

-- Subscription events table for tracking all subscription-related events
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'view_plans', 'start_checkout', 'complete_checkout', 
    'cancel_subscription', 'upgrade_subscription', 'downgrade_subscription',
    'payment_error', 'subscription_renewed', 'subscription_expired'
  )),
  event_data JSONB NOT NULL DEFAULT '{}',
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  plan_id VARCHAR,
  plan_name VARCHAR,
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription metrics aggregation table for faster dashboard queries
CREATE TABLE subscription_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  upgraded_subscriptions INTEGER DEFAULT 0,
  downgraded_subscriptions INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  monthly_subscriptions INTEGER DEFAULT 0,
  yearly_subscriptions INTEGER DEFAULT 0,
  payment_errors INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4), -- Percentage as decimal (e.g., 0.0523 for 5.23%)
  churn_rate DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- User subscription history for retention analysis
CREATE TABLE user_subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR NOT NULL,
  plan_id VARCHAR NOT NULL,
  plan_name VARCHAR NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  billing_interval VARCHAR(10) NOT NULL CHECK (billing_interval IN ('month', 'year')),
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion funnel tracking
CREATE TABLE conversion_funnel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255), -- For tracking anonymous users through the funnel
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  funnel_step VARCHAR(50) NOT NULL CHECK (funnel_step IN (
    'landing_page', 'view_pricing', 'start_checkout', 'payment_info', 
    'complete_purchase', 'abandoned_checkout'
  )),
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at);
CREATE INDEX idx_subscription_events_stripe_customer_id ON subscription_events(stripe_customer_id);

CREATE INDEX idx_subscription_metrics_daily_date ON subscription_metrics_daily(date);

CREATE INDEX idx_user_subscription_history_user_id ON user_subscription_history(user_id);
CREATE INDEX idx_user_subscription_history_stripe_subscription_id ON user_subscription_history(stripe_subscription_id);
CREATE INDEX idx_user_subscription_history_status ON user_subscription_history(status);
CREATE INDEX idx_user_subscription_history_started_at ON user_subscription_history(started_at);

CREATE INDEX idx_conversion_funnel_events_session_id ON conversion_funnel_events(session_id);
CREATE INDEX idx_conversion_funnel_events_user_id ON conversion_funnel_events(user_id);
CREATE INDEX idx_conversion_funnel_events_funnel_step ON conversion_funnel_events(funnel_step);
CREATE INDEX idx_conversion_funnel_events_created_at ON conversion_funnel_events(created_at);

-- Add comments for documentation
COMMENT ON TABLE subscription_events IS 'Tracks all subscription-related events for analytics and reporting';
COMMENT ON TABLE subscription_metrics_daily IS 'Daily aggregated subscription metrics for dashboard performance';
COMMENT ON TABLE user_subscription_history IS 'Complete history of user subscriptions for retention analysis';
COMMENT ON TABLE conversion_funnel_events IS 'Tracks user journey through the subscription conversion funnel';

-- Create a function to update daily metrics (to be called by a scheduled job)
CREATE OR REPLACE FUNCTION update_daily_subscription_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO subscription_metrics_daily (
    date,
    new_subscriptions,
    cancelled_subscriptions,
    upgraded_subscriptions,
    downgraded_subscriptions,
    total_revenue_cents,
    monthly_subscriptions,
    yearly_subscriptions,
    payment_errors
  )
  SELECT 
    target_date,
    COUNT(*) FILTER (WHERE event_type = 'complete_checkout') as new_subscriptions,
    COUNT(*) FILTER (WHERE event_type = 'cancel_subscription') as cancelled_subscriptions,
    COUNT(*) FILTER (WHERE event_type = 'upgrade_subscription') as upgraded_subscriptions,
    COUNT(*) FILTER (WHERE event_type = 'downgrade_subscription') as downgraded_subscriptions,
    COALESCE(SUM(amount_cents) FILTER (WHERE event_type = 'complete_checkout'), 0) as total_revenue_cents,
    COUNT(*) FILTER (WHERE event_type = 'complete_checkout' AND event_data->>'billing_interval' = 'month') as monthly_subscriptions,
    COUNT(*) FILTER (WHERE event_type = 'complete_checkout' AND event_data->>'billing_interval' = 'year') as yearly_subscriptions,
    COUNT(*) FILTER (WHERE event_type = 'payment_error') as payment_errors
  FROM subscription_events 
  WHERE DATE(created_at) = target_date
  ON CONFLICT (date) DO UPDATE SET
    new_subscriptions = EXCLUDED.new_subscriptions,
    cancelled_subscriptions = EXCLUDED.cancelled_subscriptions,
    upgraded_subscriptions = EXCLUDED.upgraded_subscriptions,
    downgraded_subscriptions = EXCLUDED.downgraded_subscriptions,
    total_revenue_cents = EXCLUDED.total_revenue_cents,
    monthly_subscriptions = EXCLUDED.monthly_subscriptions,
    yearly_subscriptions = EXCLUDED.yearly_subscriptions,
    payment_errors = EXCLUDED.payment_errors,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy admin dashboard queries
CREATE VIEW subscription_analytics_summary AS
SELECT 
  date,
  new_subscriptions,
  cancelled_subscriptions,
  (new_subscriptions - cancelled_subscriptions) as net_subscriptions,
  total_revenue_cents / 100.0 as total_revenue_dollars,
  CASE 
    WHEN new_subscriptions > 0 
    THEN ROUND((cancelled_subscriptions::DECIMAL / new_subscriptions) * 100, 2)
    ELSE 0 
  END as churn_rate_percentage,
  monthly_subscriptions,
  yearly_subscriptions,
  payment_errors
FROM subscription_metrics_daily
ORDER BY date DESC;

COMMENT ON VIEW subscription_analytics_summary IS 'Simplified view of subscription metrics for admin dashboard';