-- Migration: 001_ai_usage_logs
-- Description: Create AI usage logging table with proper indexing and constraints
-- Author: Security Team
-- Date: 2025-11-10
-- Database: PostgreSQL 14+

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

BEGIN;

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    tokens_used INTEGER NOT NULL CHECK (tokens_used >= 0),
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.000000 CHECK (cost_usd >= 0),
    request_payload JSONB,
    response_payload JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    latency_ms INTEGER CHECK (latency_ms >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for optimal query performance
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_endpoint ON ai_usage_logs(endpoint);
CREATE INDEX idx_ai_usage_logs_model_name ON ai_usage_logs(model_name);
CREATE INDEX idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_success ON ai_usage_logs(success) WHERE success = false;

-- Create GIN index for JSONB columns for faster JSON queries
CREATE INDEX idx_ai_usage_logs_request_payload ON ai_usage_logs USING gin(request_payload);
CREATE INDEX idx_ai_usage_logs_response_payload ON ai_usage_logs USING gin(response_payload);

-- Add foreign key constraint to users table
ALTER TABLE ai_usage_logs
ADD CONSTRAINT fk_ai_usage_logs_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_usage_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ai_usage_logs_updated_at
    BEFORE UPDATE ON ai_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_usage_logs_updated_at();

-- Create materialized view for daily usage statistics
CREATE MATERIALIZED VIEW ai_usage_daily_stats AS
SELECT 
    user_id,
    DATE(created_at) as usage_date,
    COUNT(*) as total_requests,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(latency_ms) as avg_latency_ms,
    COUNT(*) FILTER (WHERE success = false) as failed_requests
FROM ai_usage_logs
GROUP BY user_id, DATE(created_at);

-- Create index on materialized view
CREATE UNIQUE INDEX idx_ai_usage_daily_stats_user_date 
ON ai_usage_daily_stats(user_id, usage_date);

-- Add comment for documentation
COMMENT ON TABLE ai_usage_logs IS 'Tracks all AI API usage for billing, monitoring, and audit purposes';
COMMENT ON COLUMN ai_usage_logs.tokens_used IS 'Number of tokens consumed in the AI request';
COMMENT ON COLUMN ai_usage_logs.cost_usd IS 'Cost in USD for this API call';
COMMENT ON COLUMN ai_usage_logs.request_payload IS 'Sanitized request data (PII removed)';
COMMENT ON COLUMN ai_usage_logs.response_payload IS 'Sanitized response data (PII removed)';

COMMIT;

-- ============================================================================
-- ROLLBACK MIGRATION
-- ============================================================================

-- To rollback, run the following:
/*
BEGIN;

DROP MATERIALIZED VIEW IF EXISTS ai_usage_daily_stats;
DROP TRIGGER IF EXISTS trigger_ai_usage_logs_updated_at ON ai_usage_logs;
DROP FUNCTION IF EXISTS update_ai_usage_logs_updated_at();
DROP TABLE IF EXISTS ai_usage_logs CASCADE;

COMMIT;
*/
