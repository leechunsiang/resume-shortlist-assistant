-- Migration: Remove pending status from candidates
-- Date: 2024-11-07
-- Description: Updates all candidates with 'pending' status to either 'shortlisted' (score >= 50) or 'rejected' (score < 50)

-- Update candidates table
-- Set to 'shortlisted' if score >= 50, otherwise 'rejected'
UPDATE candidates
SET status = CASE 
  WHEN score >= 50 THEN 'shortlisted'
  ELSE 'rejected'
END
WHERE status = 'pending';

-- Update job_applications table
-- Set to 'shortlisted' if match_score >= 50, otherwise 'rejected'
UPDATE job_applications
SET status = CASE 
  WHEN match_score >= 50 THEN 'shortlisted'
  ELSE 'rejected'
END
WHERE status = 'pending';

-- Add comment to document the change
COMMENT ON COLUMN candidates.status IS 'Candidate status: shortlisted, rejected, interviewed, hired (pending removed)';
COMMENT ON COLUMN job_applications.status IS 'Application status: shortlisted, rejected, interviewed, hired (pending removed)';
