/*
  # Add Username Lookup Function

  1. New Functions
    - `find_user_by_username(search_username TEXT)` - Searches for users by username
      - Returns user_id, email, and username
      - Case-insensitive search
      - Uses SECURITY DEFINER to access auth.users table
  
  2. Security
    - Function has SECURITY DEFINER to access auth schema
    - Granted EXECUTE permission to authenticated users only
    - Searches username from user metadata
*/

-- Create a function to search for users by username
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