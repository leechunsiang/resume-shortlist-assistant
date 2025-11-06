-- Add expired_date column to job_listings table
ALTER TABLE job_listings 
ADD COLUMN IF NOT EXISTS expired_date DATE;

-- Add index for expired_date to improve query performance
CREATE INDEX IF NOT EXISTS idx_job_listings_expired_date ON job_listings(expired_date);

-- Add comment to explain the column
COMMENT ON COLUMN job_listings.expired_date IS 'The date when the job posting expires and should no longer accept applications';
