# Quick Setup: Organization Member Management

## Step 1: Install the SQL Function

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste this SQL:

```sql
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

GRANT EXECUTE ON FUNCTION find_user_by_username(TEXT) TO authenticated;
```

5. Click **Run** or press `Ctrl+Enter`
6. You should see "Success. No rows returned" (this is normal)

## Step 2: Test the Function (Optional)

Run this query to test if it works:

```sql
SELECT * FROM find_user_by_username('your_test_username');
```

Replace `your_test_username` with an actual username from your system.

## Step 3: Verify Your Setup

1. Start your dev server: `npm run dev`
2. Log in as an organization owner/admin
3. Go to Settings page
4. You should see:
   - Your organization information
   - List of team members
   - "Add Member" button (if you're owner/admin)

## Step 4: Add Your First Member

1. Click "Add Member" button
2. Enter a username of an existing user (without @ symbol)
3. Select a role (Admin, Member, or Viewer)
4. Click "Add Member"
5. The user should appear in the members list

## That's it! 🎉

Your organization member management is now set up and ready to use.

## Need Help?

- Check `ORGANIZATION_MEMBER_MANAGEMENT.md` for detailed documentation
- View Supabase logs for detailed error messages
- Ensure users have completed signup with usernames
