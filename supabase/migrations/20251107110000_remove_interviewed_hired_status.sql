-- Migration: Remove interviewed and hired status from candidates
-- Date: 2024-11-07
-- Description: Updates all candidates with 'interviewed' or 'hired' status to 'shortlisted'
-- Adds 'overridden' as a new valid status for manually overriding rejected candidates

-- Update candidates table
-- Set interviewed/hired to 'shortlisted' as they were previously qualified candidates
UPDATE candidates
SET status = 'shortlisted'
WHERE status IN ('interviewed', 'hired');

-- Update job_applications table
-- Set interviewed/hired to 'shortlisted' as they were previously qualified candidates
UPDATE job_applications
SET status = 'shortlisted'
WHERE status IN ('interviewed', 'hired');

-- Add comment to document the change
COMMENT ON COLUMN candidates.status IS 'Candidate status: shortlisted, rejected, overridden (interviewed and hired removed)';
COMMENT ON COLUMN job_applications.status IS 'Application status: shortlisted, rejected, overridden (interviewed and hired removed)';

-- Note: The 'overridden' status is for manually overriding auto-rejected candidates (score < 50)
-- This allows recruiters to give a second chance to candidates who were automatically rejected
