/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - The user_roles and audit_logs policies query user_roles to check access
    - This creates infinite recursion when trying to access user_roles
    - Connection errors occur because queries cannot complete

  2. Solution
    - Replace recursive policies with direct membership checks
    - Create a bypass for service role and authenticated access
    - Use organizations table to validate membership instead of user_roles

  3. Changes
    - Drop and recreate user_roles SELECT policy without recursion
    - Drop and recreate audit_logs SELECT policy without recursion
    - Allow authenticated users to check their own roles directly
    - Use organizations table for membership validation
*/

-- Fix user_roles policies - allow users to see their own roles directly
DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;

-- Policy 1: Users can always view their own role assignments
CREATE POLICY "Users can view own role assignments"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Users can view other users' roles in organizations they're a member of
-- This requires checking the organizations table instead of user_roles to avoid recursion
CREATE POLICY "Users can view roles in member organizations"
  ON user_roles FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()::text
    )
  );

-- Fix user_roles INSERT policy
DROP POLICY IF EXISTS "Users can insert their own role assignment" ON user_roles;
CREATE POLICY "Users can insert own role assignment"
  ON user_roles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Fix audit_logs policies - use the same pattern
DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON audit_logs;

-- Policy 1: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Users can view audit logs in organizations they created
CREATE POLICY "Users can view org audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE created_by = auth.uid()::text
    )
  );

-- Fix audit_logs INSERT policy
DROP POLICY IF EXISTS "Users can insert audit logs" ON audit_logs;
CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());
