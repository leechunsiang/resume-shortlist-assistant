/*
  # Create Base Database Schema for Resume Shortlist Assistant

  1. New Tables
    - `organizations` - Store organization/company information
      - `id` (uuid, primary key)
      - `name` (varchar, unique)
      - `description`, `logo_url`, `website`, `industry`, `size` (optional metadata)
      - `created_by` (varchar) - user_id from auth
      - `created_at`, `updated_at` (timestamps)
    
    - `organization_members` - Links users to organizations with roles
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `user_id`, `user_email` (varchar)
      - `role` (varchar) - owner, admin, member, viewer
      - `invited_by`, `invited_at`, `joined_at` (tracking fields)
      - `status` (varchar) - active, pending, inactive
    
    - `job_listings` - Job postings
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `title`, `department`, `location`, `employment_type` (varchar)
      - `description`, `requirements` (text)
      - `status` (varchar) - active, inactive, draft
      - `created_by` (varchar)
    
    - `candidates` - Candidate profiles
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `first_name`, `last_name`, `email`, `phone` (contact info)
      - `resume_url`, `resume_text` (text)
      - `linkedin_url`, `current_position` (varchar)
      - `years_of_experience` (integer)
      - `skills` (text array)
      - `education`, `work_experience` (jsonb)
      - `status` (varchar) - pending, shortlisted, rejected, interviewed, hired
      - `score` (integer) - AI-generated score 0-100
      - `notes` (text)
    
    - `job_applications` - Links candidates to jobs
      - `id` (uuid, primary key)
      - `job_id`, `candidate_id` (uuid, foreign keys)
      - `status`, `match_score`, `ai_analysis` (application data)
      - `applied_at`, `reviewed_at`, `reviewed_by` (tracking)
    
    - `filters` - Saved search filters
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `name`, `description` (varchar/text)
      - `criteria` (jsonb) - filter criteria
      - `is_active` (boolean)
    
    - `activity_log` - Track all actions
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `user_id`, `action`, `entity_type`, `entity_id` (tracking fields)
      - `details` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add permissive policies (to be restricted after auth setup)
    - Create indexes for performance
    - Add triggers for auto-updating timestamps

  3. Views
    - `dashboard_stats` - Aggregated statistics
    - `recent_candidates` - Latest 20 candidates
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    size VARCHAR(50),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    invited_by VARCHAR(255),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create job_listings table
CREATE TABLE IF NOT EXISTS job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    employment_type VARCHAR(50),
    description TEXT,
    requirements TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    resume_text TEXT,
    linkedin_url VARCHAR(255),
    current_position VARCHAR(255),
    years_of_experience INTEGER,
    skills TEXT[],
    education JSONB,
    work_experience JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    score INTEGER,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    match_score INTEGER,
    ai_analysis JSONB,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Create filters table
CREATE TABLE IF NOT EXISTS filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_organization_id ON job_listings(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_status ON job_listings(status);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_score ON candidates(score DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_filters_organization_id ON filters(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updated_at columns
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
    BEFORE UPDATE ON job_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_filters_updated_at
    BEFORE UPDATE ON filters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM candidates) as total_candidates,
    (SELECT COUNT(*) FROM candidates WHERE status = 'shortlisted') as shortlisted_count,
    (SELECT COUNT(*) FROM candidates WHERE status = 'pending') as pending_review,
    (SELECT ROUND(AVG(score)) FROM candidates WHERE status = 'shortlisted') as avg_success_score,
    (SELECT COUNT(*) FROM job_listings WHERE status = 'active') as active_jobs;

CREATE OR REPLACE VIEW recent_candidates AS
SELECT 
    id,
    first_name,
    last_name,
    email,
    current_position,
    score,
    status,
    skills,
    created_at,
    updated_at
FROM candidates
ORDER BY created_at DESC
LIMIT 20;

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (will be restricted after proper auth setup)
CREATE POLICY "Allow all operations on organizations" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all operations on organization_members" ON organization_members FOR ALL USING (true);
CREATE POLICY "Allow all operations on job_listings" ON job_listings FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidates" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow all operations on job_applications" ON job_applications FOR ALL USING (true);
CREATE POLICY "Allow all operations on filters" ON filters FOR ALL USING (true);
CREATE POLICY "Allow all operations on activity_log" ON activity_log FOR ALL USING (true);