-- Migration: Create API usage logs table
-- Date: 2024-11-07
-- Description: Track OpenAI API usage per user for cost monitoring and analytics

-- Create api_usage_logs table
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and organization tracking
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- API call details
    endpoint TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-4.1-nano',
    
    -- Token usage
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    
    -- Cost tracking (in USD)
    input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    
    -- Request details
    request_type TEXT,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    job_id UUID REFERENCES job_listings(id) ON DELETE SET NULL,
    
    -- Response metadata
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    response_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_tokens CHECK (input_tokens >= 0 AND output_tokens >= 0 AND total_tokens >= 0),
    CONSTRAINT valid_costs CHECK (input_cost >= 0 AND output_cost >= 0 AND total_cost >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_organization_id ON api_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_created ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_org_created ON api_usage_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_candidate_id ON api_usage_logs(candidate_id) WHERE candidate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_job_id ON api_usage_logs(job_id) WHERE job_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own API usage logs" ON api_usage_logs;
DROP POLICY IF EXISTS "Service role can insert API usage logs" ON api_usage_logs;

-- RLS Policy: Users can view their own usage logs
CREATE POLICY "Users can view own API usage logs"
    ON api_usage_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- RLS Policy: Service role can insert usage logs
CREATE POLICY "Service role can insert API usage logs"
    ON api_usage_logs
    FOR INSERT
    WITH CHECK (true);

-- Create a view for usage analytics
CREATE OR REPLACE VIEW api_usage_analytics AS
SELECT
    user_id,
    organization_id,
    endpoint,
    model,
    DATE_TRUNC('day', created_at) AS usage_date,
    COUNT(*) AS request_count,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(total_tokens) AS total_tokens_used,
    SUM(total_cost) AS total_cost,
    AVG(response_time_ms) AS avg_response_time_ms,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) AS successful_requests,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS failed_requests
FROM api_usage_logs
GROUP BY user_id, organization_id, endpoint, model, DATE_TRUNC('day', created_at);

-- Grant access to the view
GRANT SELECT ON api_usage_analytics TO authenticated;

-- Function to get user usage summary
CREATE OR REPLACE FUNCTION get_user_usage_summary(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_requests BIGINT,
    total_tokens BIGINT,
    total_cost NUMERIC,
    by_endpoint JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(COUNT(*), 0)::BIGINT AS total_requests,
        COALESCE(SUM(total_tokens), 0)::BIGINT AS total_tokens,
        COALESCE(SUM(total_cost), 0)::NUMERIC AS total_cost,
        COALESCE(
            jsonb_object_agg(
                endpoint,
                jsonb_build_object(
                    'requests', request_count,
                    'tokens', tokens_used,
                    'cost', cost
                )
            ),
            '{}'::jsonb
        ) AS by_endpoint
    FROM (
        SELECT
            endpoint,
            COUNT(*) AS request_count,
            SUM(total_tokens) AS tokens_used,
            SUM(total_cost) AS cost
        FROM api_usage_logs
        WHERE user_id = p_user_id
        AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY endpoint
    ) subquery;
END;
$$;

-- Function to get organization usage summary
CREATE OR REPLACE FUNCTION get_organization_usage_summary(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_requests BIGINT,
    total_tokens BIGINT,
    total_cost NUMERIC,
    by_user JSONB,
    by_endpoint JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(COUNT(*), 0)::BIGINT AS total_requests,
        COALESCE(SUM(total_tokens), 0)::BIGINT AS total_tokens,
        COALESCE(SUM(total_cost), 0)::NUMERIC AS total_cost,
        COALESCE(
            (
                SELECT jsonb_object_agg(
                    user_id::TEXT,
                    jsonb_build_object(
                        'requests', request_count,
                        'tokens', tokens_used,
                        'cost', cost
                    )
                )
                FROM (
                    SELECT
                        user_id,
                        COUNT(*) AS request_count,
                        SUM(total_tokens) AS tokens_used,
                        SUM(total_cost) AS cost
                    FROM api_usage_logs
                    WHERE organization_id = p_organization_id
                    AND created_at BETWEEN p_start_date AND p_end_date
                    GROUP BY user_id
                ) user_summary
            ),
            '{}'::jsonb
        ) AS by_user,
        COALESCE(
            (
                SELECT jsonb_object_agg(
                    endpoint,
                    jsonb_build_object(
                        'requests', request_count,
                        'tokens', tokens_used,
                        'cost', cost
                    )
                )
                FROM (
                    SELECT
                        endpoint,
                        COUNT(*) AS request_count,
                        SUM(total_tokens) AS tokens_used,
                        SUM(total_cost) AS cost
                    FROM api_usage_logs
                    WHERE organization_id = p_organization_id
                    AND created_at BETWEEN p_start_date AND p_end_date
                    GROUP BY endpoint
                ) endpoint_summary
            ),
            '{}'::jsonb
        ) AS by_endpoint
    FROM api_usage_logs
    WHERE organization_id = p_organization_id
    AND created_at BETWEEN p_start_date AND p_end_date
    LIMIT 1;
END;
$$;

-- Add comments
COMMENT ON TABLE api_usage_logs IS 'Tracks OpenAI API usage per user for cost monitoring and analytics';
COMMENT ON COLUMN api_usage_logs.input_tokens IS 'Number of input tokens used';
COMMENT ON COLUMN api_usage_logs.output_tokens IS 'Number of output tokens generated';
COMMENT ON COLUMN api_usage_logs.total_cost IS 'Total cost in USD for this API call';
COMMENT ON COLUMN api_usage_logs.response_time_ms IS 'API response time in milliseconds';

