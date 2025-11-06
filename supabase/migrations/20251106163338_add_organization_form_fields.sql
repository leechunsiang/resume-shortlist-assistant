/*
  # Add Organization Form Fields

  1. Changes to Organizations Table
    - Add `department` column (VARCHAR 100) - Department within the organization
    - Add `job_role` column (VARCHAR 100) - User's job role/position
    - Add `expected_resume_volume` column (VARCHAR 50) - Expected number of resumes to process
    - Modify `description` column to be nullable

  2. Details
    - All new columns are optional (nullable) to maintain backward compatibility
    - Existing organization records will not be affected
    - Added comment to expected_resume_volume field for clarity
    - Uses IF NOT EXISTS to prevent errors if columns already exist

  3. Purpose
    - Enhance organization setup form with additional context fields
    - Help understand the user's department, role, and expected usage volume
    - Improve user onboarding experience
*/

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