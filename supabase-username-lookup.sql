-- SQL function to find user by username
-- This should be added to your Supabase SQL Editor

-- Create a function to search for users by username
-- Since we can't directly query auth.users, we'll use the auth schema with proper permissions
CREATE OR REPLACE FUNCTION find_user_by_username(search_username TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    au.raw_user_meta_data->>'username' as username
  FROM auth.users au
  WHERE LOWER(au.raw_user_meta_data->>'username') = LOWER(search_username)
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_user_by_username(TEXT) TO authenticated;

-- Create an index on raw_user_meta_data for better performance (if not exists)
-- Note: This needs to be done carefully as it's on the auth schema
-- CREATE INDEX IF NOT EXISTS idx_users_username ON auth.users ((raw_user_meta_data->>'username'));
