-- Add retention tracking and cohort analysis tables

-- Cohort analysis table for tracking user retention by subscription start month
CREATE TABLE subscription_cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_month DATE NOT NULL, -- First day of the month when users subscribed
  period_number INTEGER NOT NULL, -- 0 = first month, 1 = second month, etc.
  users_count INTEGER NOT NULL DEFAULT 0,
  retained_users INTEGER NOT NULL DEFAULT 0,
  retention_rate DECIMAL(5,4), -- Percentage as decimal (e.g., 0.7500 for 75%)
  revenue_retained_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cohort_month, period_number)
);

-- User retention tracking table
CREATE TABLE user_retention_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_month DATE NOT NULL, -- Month when user first subscribed
  subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  current_subscription_id VARCHAR,
  is_active BOOLEAN DEFAULT true,
  months_retained INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP WITH TIME ZONE,
  churn_date TIMESTAMP WITH TIME ZONE,
  churn_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cohort_month)
);

-- Subscription lifecycle events for detailed retention analysis
CREATE TABLE subscription_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id VARCHAR NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'subscription_started', 'subscription_renewed', 'subscription_paused',
    'subscription_resumed', 'subscription_cancelled', 'subscription_expired',
    'payment_failed', 'payment_recovered', 'plan_changed'
  )),
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  plan_id VARCHAR,
  amount_cents INTEGER,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_subscription_cohorts_cohort_month ON subscription_cohorts(cohort_month);
CREATE INDEX idx_subscription_cohorts_period_number ON subscription_cohorts(period_number);

CREATE INDEX idx_user_retention_tracking_user_id ON user_retention_tracking(user_id);
CREATE INDEX idx_user_retention_tracking_cohort_month ON user_retention_tracking(cohort_month);
CREATE INDEX idx_user_retention_tracking_is_active ON user_retention_tracking(is_active);
CREATE INDEX idx_user_retention_tracking_churn_date ON user_retention_tracking(churn_date);

CREATE INDEX idx_subscription_lifecycle_events_user_id ON subscription_lifecycle_events(user_id);
CREATE INDEX idx_subscription_lifecycle_events_subscription_id ON subscription_lifecycle_events(subscription_id);
CREATE INDEX idx_subscription_lifecycle_events_event_type ON subscription_lifecycle_events(event_type);
CREATE INDEX idx_subscription_lifecycle_events_created_at ON subscription_lifecycle_events(created_at);

-- Function to initialize user retention tracking when a subscription starts
CREATE OR REPLACE FUNCTION initialize_user_retention_tracking(
  p_user_id UUID,
  p_subscription_id VARCHAR,
  p_subscription_start_date TIMESTAMP WITH TIME ZONE,
  p_amount_cents INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  cohort_month_date DATE;
BEGIN
  -- Calculate cohort month (first day of the month when user subscribed)
  cohort_month_date := DATE_TRUNC('month', p_subscription_start_date)::DATE;
  
  -- Insert or update user retention tracking
  INSERT INTO user_retention_tracking (
    user_id,
    cohort_month,
    subscription_start_date,
    current_subscription_id,
    is_active,
    months_retained,
    total_revenue_cents,
    last_activity_date
  )
  VALUES (
    p_user_id,
    cohort_month_date,
    p_subscription_start_date,
    p_subscription_id,
    true,
    0,
    p_amount_cents,
    p_subscription_start_date
  )
  ON CONFLICT (user_id, cohort_month) DO UPDATE SET
    current_subscription_id = p_subscription_id,
    is_active = true,
    total_revenue_cents = user_retention_tracking.total_revenue_cents + p_amount_cents,
    last_activity_date = p_subscription_start_date,
    churn_date = NULL,
    churn_reason = NULL,
    updated_at = NOW();
    
  -- Log the lifecycle event
  INSERT INTO subscription_lifecycle_events (
    user_id,
    subscription_id,
    event_type,
    new_status,
    amount_cents,
    event_data
  )
  VALUES (
    p_user_id,
    p_subscription_id,
    'subscription_started',
    'active',
    p_amount_cents,
    jsonb_build_object('cohort_month', cohort_month_date)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update user retention when subscription is cancelled
CREATE OR REPLACE FUNCTION update_user_retention_on_cancellation(
  p_user_id UUID,
  p_subscription_id VARCHAR,
  p_churn_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update user retention tracking
  UPDATE user_retention_tracking 
  SET 
    is_active = false,
    churn_date = NOW(),
    churn_reason = p_churn_reason,
    updated_at = NOW()
  WHERE user_id = p_user_id 
    AND current_subscription_id = p_subscription_id;
    
  -- Log the lifecycle event
  INSERT INTO subscription_lifecycle_events (
    user_id,
    subscription_id,
    event_type,
    previous_status,
    new_status,
    event_data
  )
  VALUES (
    p_user_id,
    p_subscription_id,
    'subscription_cancelled',
    'active',
    'cancelled',
    jsonb_build_object('churn_reason', p_churn_reason)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and update cohort retention data
CREATE OR REPLACE FUNCTION update_cohort_retention_data()
RETURNS VOID AS $$
DECLARE
  cohort_record RECORD;
  period_record RECORD;
BEGIN
  -- Clear existing cohort data to recalculate
  DELETE FROM subscription_cohorts;
  
  -- Calculate retention for each cohort month and period
  FOR cohort_record IN 
    SELECT DISTINCT cohort_month 
    FROM user_retention_tracking 
    ORDER BY cohort_month
  LOOP
    -- Calculate retention for each period (0 to 12 months)
    FOR period_num IN 0..12 LOOP
      WITH cohort_data AS (
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (
            WHERE (
              is_active = true 
              OR churn_date >= (cohort_month + INTERVAL '1 month' * period_num)
            )
            AND subscription_start_date <= (cohort_month + INTERVAL '1 month' * period_num)
          ) as retained_users,
          COALESCE(SUM(
            CASE 
              WHEN is_active = true OR churn_date >= (cohort_month + INTERVAL '1 month' * period_num)
              THEN total_revenue_cents 
              ELSE 0 
            END
          ), 0) as revenue_retained
        FROM user_retention_tracking 
        WHERE cohort_month = cohort_record.cohort_month
      )
      INSERT INTO subscription_cohorts (
        cohort_month,
        period_number,
        users_count,
        retained_users,
        retention_rate,
        revenue_retained_cents
      )
      SELECT 
        cohort_record.cohort_month,
        period_num,
        total_users,
        retained_users,
        CASE 
          WHEN total_users > 0 
          THEN ROUND(retained_users::DECIMAL / total_users, 4)
          ELSE 0 
        END,
        revenue_retained
      FROM cohort_data
      WHERE total_users > 0;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update monthly retention metrics for active users
CREATE OR REPLACE FUNCTION update_monthly_retention_metrics()
RETURNS VOID AS $$
BEGIN
  -- Update months_retained for all active users
  UPDATE user_retention_tracking 
  SET 
    months_retained = EXTRACT(MONTH FROM AGE(NOW(), subscription_start_date))::INTEGER,
    updated_at = NOW()
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create views for easy querying
CREATE VIEW cohort_retention_summary AS
SELECT 
  cohort_month,
  period_number,
  users_count,
  retained_users,
  ROUND(retention_rate * 100, 2) as retention_percentage,
  revenue_retained_cents / 100.0 as revenue_retained_dollars
FROM subscription_cohorts
ORDER BY cohort_month DESC, period_number ASC;

CREATE VIEW user_retention_summary AS
SELECT 
  cohort_month,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE is_active = false) as churned_users,
  ROUND(
    (COUNT(*) FILTER (WHERE is_active = true)::DECIMAL / COUNT(*)) * 100, 2
  ) as retention_percentage,
  AVG(months_retained) FILTER (WHERE is_active = true) as avg_months_retained,
  SUM(total_revenue_cents) / 100.0 as total_revenue_dollars
FROM user_retention_tracking
GROUP BY cohort_month
ORDER BY cohort_month DESC;

-- Add comments
COMMENT ON TABLE subscription_cohorts IS 'Cohort analysis data for tracking user retention by subscription start month';
COMMENT ON TABLE user_retention_tracking IS 'Individual user retention tracking with cohort assignment';
COMMENT ON TABLE subscription_lifecycle_events IS 'Detailed subscription lifecycle events for retention analysis';
COMMENT ON VIEW cohort_retention_summary IS 'Summary view of cohort retention rates and revenue';
COMMENT ON VIEW user_retention_summary IS 'Summary view of user retention by cohort month';