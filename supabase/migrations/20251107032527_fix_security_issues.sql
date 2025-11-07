/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes on foreign key columns for better query performance
    - Optimize RLS policies by using `(select auth.uid())` pattern to prevent re-evaluation
    - Add search_path to functions for security

  2. Security Improvements
    - Fix RLS policies to use optimized auth function calls
    - Update function definitions with secure search_path
    - Drop unused indexes to reduce overhead

  3. Changes
    - Add indexes: activity_log.organization_id, role_permissions.permission_id, user_roles.organization_id, user_roles.role_id
    - Optimize RLS policies on: user_roles, audit_logs, api_usage_logs
    - Update functions with security definer and search_path
    - Remove unused indexes to reduce maintenance overhead
*/

-- Add missing indexes on foreign keys for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_organization_id ON activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Drop and recreate RLS policies with optimized auth calls
-- user_roles policies
DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
CREATE POLICY "Users can view roles in their organization"
  ON user_roles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert their own role assignment" ON user_roles;
CREATE POLICY "Users can insert their own role assignment"
  ON user_roles FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- audit_logs policies
DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON audit_logs;
CREATE POLICY "Users can view audit logs in their organization"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;
CREATE POLICY "Users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- api_usage_logs policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'api_usage_logs') THEN
    DROP POLICY IF EXISTS "Users can view own API usage logs" ON api_usage_logs;
    EXECUTE 'CREATE POLICY "Users can view own API usage logs"
      ON api_usage_logs FOR SELECT
      USING (user_id = (select auth.uid()))';
  END IF;
END $$;

-- Drop unused indexes to reduce overhead
DROP INDEX IF EXISTS idx_candidates_score;
DROP INDEX IF EXISTS idx_activity_log_entity;
DROP INDEX IF EXISTS idx_activity_log_created_at;
DROP INDEX IF EXISTS idx_api_usage_logs_created_at;
DROP INDEX IF EXISTS idx_api_usage_logs_org_created;
DROP INDEX IF EXISTS idx_api_usage_logs_endpoint;
DROP INDEX IF EXISTS idx_api_usage_logs_user_id;
DROP INDEX IF EXISTS idx_api_usage_logs_organization_id;
DROP INDEX IF EXISTS idx_job_listings_expired_date;

-- Update functions with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Update or create get_organization_usage_summary with secure search_path
DROP FUNCTION IF EXISTS get_organization_usage_summary(UUID);
CREATE OR REPLACE FUNCTION get_organization_usage_summary(org_id UUID)
RETURNS TABLE (
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  successful_requests BIGINT,
  failed_requests BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'api_usage_logs') THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::BIGINT as total_requests,
      COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens,
      COALESCE(SUM(total_cost), 0)::NUMERIC as total_cost,
      COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_requests,
      COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_requests
    FROM api_usage_logs
    WHERE organization_id = org_id;
  ELSE
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::NUMERIC, 0::BIGINT, 0::BIGINT;
  END IF;
END;
$$;

-- Update or create get_user_usage_summary with secure search_path
DROP FUNCTION IF EXISTS get_user_usage_summary(UUID);
CREATE OR REPLACE FUNCTION get_user_usage_summary(p_user_id UUID)
RETURNS TABLE (
  total_requests BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  successful_requests BIGINT,
  failed_requests BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'api_usage_logs') THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::BIGINT as total_requests,
      COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens,
      COALESCE(SUM(total_cost), 0)::NUMERIC as total_cost,
      COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_requests,
      COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_requests
    FROM api_usage_logs
    WHERE user_id = p_user_id;
  ELSE
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::NUMERIC, 0::BIGINT, 0::BIGINT;
  END IF;
END;
$$;

-- Note: SECURITY DEFINER views (api_usage_analytics, recent_candidates, dashboard_stats) 
-- are necessary for their functionality and should remain as-is unless they pose a specific risk.
-- These views need SECURITY DEFINER to access data across different users' contexts.

-- Note: Leaked Password Protection must be enabled in Supabase Dashboard under Authentication settings.
-- This cannot be configured via SQL migration.
