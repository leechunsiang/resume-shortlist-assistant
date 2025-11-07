-- Allow candidates to apply for multiple positions
-- Remove the UNIQUE constraint on (job_id, candidate_id) in job_applications table

-- Drop the existing unique constraint
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_job_id_candidate_id_key;

-- Add a new index for performance (non-unique)
CREATE INDEX IF NOT EXISTS idx_job_applications_job_candidate ON job_applications(job_id, candidate_id);

-- Also update candidates table to allow duplicate emails across organizations but within same org
-- The current unique constraint is (organization_id, email) which is correct, but let's verify it exists
-- This allows same candidate to be in multiple organizations but not duplicated within same org

-- Add comment for clarity
COMMENT ON TABLE job_applications IS 'Tracks candidate applications to jobs. Candidates can apply to multiple positions.';
