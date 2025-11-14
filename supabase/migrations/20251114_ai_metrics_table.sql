-- AXIOM:1 COMPLIANT AI METRICS TABLE
--
-- This table stores observability data for all AI operations:
-- - Token usage and cost tracking
-- - Performance metrics (latency, error rates)
-- - Provider health monitoring
-- - Audit trail for compliance
--
-- Oracle Tier Standards:
-- - <50ms query performance (indexed)
-- - Comprehensive monitoring
-- - Historical trend analysis

-- Create ai_metrics table
CREATE TABLE IF NOT EXISTS ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider and model information
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,

  -- Performance metrics
  latency_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,

  -- Token usage
  tokens_prompt INTEGER NOT NULL DEFAULT 0,
  tokens_completion INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,

  -- Cost tracking
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,

  -- Caching
  cached BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_metrics_created_at ON ai_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_provider ON ai_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_success ON ai_metrics(success);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_cost ON ai_metrics(cost_usd DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_ai_metrics_provider_created
  ON ai_metrics(provider, created_at DESC);

-- Add RLS policies (Row Level Security)
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write metrics
CREATE POLICY "Service role can manage ai_metrics"
  ON ai_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create view for daily cost summary
CREATE OR REPLACE VIEW ai_daily_cost_summary AS
SELECT
  DATE(created_at) as date,
  provider,
  COUNT(*) as total_requests,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
  ROUND(AVG(latency_ms)::numeric, 2) as avg_latency_ms,
  SUM(tokens_total) as total_tokens,
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  ROUND((SUM(CASE WHEN NOT success THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100)::numeric, 2) as error_rate_percent
FROM ai_metrics
GROUP BY DATE(created_at), provider
ORDER BY date DESC, provider;

-- Create view for hourly metrics (for anomaly detection)
CREATE OR REPLACE VIEW ai_hourly_metrics AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  provider,
  COUNT(*) as total_requests,
  ROUND(AVG(latency_ms)::numeric, 2) as avg_latency_ms,
  SUM(tokens_total) as total_tokens,
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  ROUND((SUM(CASE WHEN NOT success THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100)::numeric, 2) as error_rate_percent
FROM ai_metrics
GROUP BY DATE_TRUNC('hour', created_at), provider
ORDER BY hour DESC, provider;

-- Create function to get p95 latency (for Oracle Tier monitoring)
CREATE OR REPLACE FUNCTION ai_p95_latency(hours_ago INTEGER DEFAULT 1)
RETURNS TABLE (
  provider TEXT,
  p95_latency_ms DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_metrics.provider,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms
  FROM ai_metrics
  WHERE created_at >= NOW() - INTERVAL '1 hour' * hours_ago
    AND success = true
  GROUP BY ai_metrics.provider;
END;
$$ LANGUAGE plpgsql;

-- Create function to check Oracle Tier compliance
CREATE OR REPLACE FUNCTION check_oracle_tier_compliance()
RETURNS TABLE (
  metric TEXT,
  target TEXT,
  actual TEXT,
  compliant BOOLEAN
) AS $$
DECLARE
  p95_latency DECIMAL;
  error_rate DECIMAL;
  uptime_percent DECIMAL;
BEGIN
  -- Check p95 latency (<50ms target)
  SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)
  INTO p95_latency
  FROM ai_metrics
  WHERE created_at >= NOW() - INTERVAL '1 hour'
    AND success = true;

  RETURN QUERY SELECT
    'Response Time (p95)'::TEXT,
    '<50ms'::TEXT,
    ROUND(p95_latency, 2)::TEXT || 'ms',
    (p95_latency < 50);

  -- Check error rate (<0.1% target)
  SELECT (SUM(CASE WHEN NOT success THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100)
  INTO error_rate
  FROM ai_metrics
  WHERE created_at >= NOW() - INTERVAL '24 hours';

  RETURN QUERY SELECT
    'Error Rate'::TEXT,
    '<0.1%'::TEXT,
    ROUND(error_rate, 3)::TEXT || '%',
    (error_rate < 0.1);

  -- Check uptime (99.999%+ target)
  SELECT ((SUM(CASE WHEN success THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100)
  INTO uptime_percent
  FROM ai_metrics
  WHERE created_at >= NOW() - INTERVAL '24 hours';

  RETURN QUERY SELECT
    'Uptime'::TEXT,
    '99.999%+'::TEXT,
    ROUND(uptime_percent, 3)::TEXT || '%',
    (uptime_percent >= 99.999);
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE ai_metrics IS 'AXIOM:1 compliant AI metrics for observability and cost tracking';
COMMENT ON FUNCTION check_oracle_tier_compliance() IS 'Check if AI system meets Oracle Tier standards';
