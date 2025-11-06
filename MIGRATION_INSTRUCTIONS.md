# Database Migration: Add Expired Date to Job Listings

## How to Apply This Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `yfljhsgwbclprbsteqox`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the SQL from the migration file:
   `supabase/migrations/20251107000000_add_expired_date_to_job_listings.sql`
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push
```

## What This Migration Does
- Adds an `expired_date` column to the `job_listings` table
- The column is optional (nullable) and stores DATE values
- Adds an index for better query performance
- Adds a helpful comment explaining the column's purpose

## Verification
After running the migration, you can verify it worked by running this query in the SQL Editor:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_listings' 
AND column_name = 'expired_date';
```

You should see:
- column_name: expired_date
- data_type: date
- is_nullable: YES
