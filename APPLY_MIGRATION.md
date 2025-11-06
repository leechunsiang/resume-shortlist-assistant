# Apply Database Migration: Add expired_date to job_listings

## Migration Status
⚠️ **PENDING** - This migration needs to be applied manually via Supabase Dashboard

## Why Manual Application is Needed
The Supabase API keys are not configured for direct SQL execution from scripts. The migration must be applied through the Supabase Dashboard SQL Editor.

## How to Apply

### Step 1: Access Supabase Dashboard
1. Go to: https://yfljhsgwbclprbsteqox.supabase.co
2. Navigate to the **SQL Editor** section (left sidebar)

### Step 2: Run the Migration SQL
Copy and paste the following SQL into the SQL Editor and click **Run**:

```sql
-- Add expired_date column to job_listings table
ALTER TABLE job_listings
ADD COLUMN IF NOT EXISTS expired_date DATE;

-- Add index for expired_date to improve query performance
CREATE INDEX IF NOT EXISTS idx_job_listings_expired_date ON job_listings(expired_date);

-- Add comment to explain the column
COMMENT ON COLUMN job_listings.expired_date IS 'The date when the job posting expires and should no longer accept applications';
```

### Step 3: Verify the Migration
After running the SQL, verify it worked by running this query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'job_listings'
  AND column_name = 'expired_date';
```

You should see:
- **column_name**: expired_date
- **data_type**: date
- **is_nullable**: YES

## What This Migration Does

1. **Adds `expired_date` column** (DATE type)
   - Optional/nullable field
   - Stores when a job posting should expire
   - No default value (NULL for existing records)

2. **Creates performance index**
   - Index name: `idx_job_listings_expired_date`
   - Improves query speed when filtering by expiration date
   - Useful for finding expired or soon-to-expire jobs

3. **Adds documentation**
   - Column comment explains the purpose
   - Helps developers understand the field's intent

## Application Integration

✅ **Already Completed**:
- TypeScript interface updated (`JobListing` in `src/lib/supabase.ts`)
- Build verified and passing
- Code ready to use the new field

## Next Steps After Migration

Once the migration is applied, you can:

1. Update job listing forms to include an expiration date picker
2. Add logic to mark jobs as inactive when they expire
3. Create automated cleanup tasks for expired jobs
4. Add filters to show/hide expired job listings

## Migration File Location
`supabase/migrations/20251107000000_add_expired_date_to_job_listings.sql`
