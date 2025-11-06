-- Migration to add department, job_role, and expected_resume_volume fields to organizations table
-- Run this in your Supabase SQL Editor

-- Add new columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS job_role VARCHAR(100),
ADD COLUMN IF NOT EXISTS expected_resume_volume VARCHAR(50);

-- Make description nullable (if it wasn't already)
ALTER TABLE organizations
ALTER COLUMN description DROP NOT NULL;

-- Add comment for expected_resume_volume field
COMMENT ON COLUMN organizations.expected_resume_volume IS 'Expected number of resumes to process: 1-50, 51-100, 101-200, 201-500, 500+';
