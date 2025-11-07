-- Fix API Usage Functions
-- Run this if you already have the api_usage_logs table but missing the functions

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_usage_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_usage_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
