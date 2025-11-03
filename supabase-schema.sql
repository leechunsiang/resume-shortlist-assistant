-- Resume Shortlist Assistant Database Schema
-- Copy and paste this into your Supabase SQL Editor

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
    size VARCHAR(50), -- e.g., '1-10', '11-50', '51-200', etc.
    created_by VARCHAR(255) NOT NULL, -- user_id from auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization_members table (links users to organizations)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL, -- user_id from Supabase auth
    user_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
    invited_by VARCHAR(255), -- user_id who sent the invite
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active', -- active, pending, inactive
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
    employment_type VARCHAR(50), -- Full-time, Part-time, Contract, etc.
    description TEXT,
    requirements TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, closed, draft
    created_by VARCHAR(255), -- user_id from auth
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
    resume_url TEXT, -- URL to stored resume file
    resume_text TEXT, -- Extracted text from resume
    linkedin_url VARCHAR(255),
    current_position VARCHAR(255),
    years_of_experience INTEGER,
    skills TEXT[], -- Array of skills
    education JSONB, -- Store education as JSON
    work_experience JSONB, -- Store work history as JSON
    status VARCHAR(50) DEFAULT 'pending', -- pending, shortlisted, rejected, interviewed, hired
    score INTEGER, -- AI-generated score (0-100)
    notes TEXT,
    created_by VARCHAR(255), -- user_id from auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, email) -- Email unique per organization
);

-- Create job_applications table (links candidates to jobs)
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES job_listings(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, shortlisted, rejected, interviewed, hired
    match_score INTEGER, -- Job-specific match score (0-100)
    ai_analysis JSONB, -- Store AI analysis results
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Create filters table (saved search filters)
CREATE TABLE IF NOT EXISTS filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- Store filter criteria as JSON
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_log table (track all actions)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- uploaded_resume, shortlisted, rejected, etc.
    entity_type VARCHAR(50), -- candidate, job, application
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_status ON organization_members(status);
CREATE INDEX idx_job_listings_organization_id ON job_listings(organization_id);
CREATE INDEX idx_candidates_organization_id ON candidates(organization_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_score ON candidates(score DESC);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_candidate_id ON job_applications(candidate_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_listings_status ON job_listings(status);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_filters_organization_id ON filters(organization_id);

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

-- Sample data is commented out - organizations must be created by users
-- You can uncomment and modify this for testing

-- INSERT INTO job_listings (title, department, location, employment_type, description, requirements, status)
VALUES 
    ('Senior Developer', 'Engineering', 'Remote', 'Full-time', 
     'We are looking for an experienced developer to join our team.', 
     'React, TypeScript, Node.js, 5+ years experience', 'active'),
    ('Product Manager', 'Product', 'San Francisco, CA', 'Full-time', 
     'Lead product strategy and development for our flagship product.', 
     'Product management experience, Agile, stakeholder management', 'active'),
    ('UX Designer', 'Design', 'New York, NY', 'Full-time', 
     'Create beautiful and intuitive user experiences.', 
     'Figma, User Research, Prototyping, 3+ years experience', 'active');

-- Insert sample candidates
INSERT INTO candidates (first_name, last_name, email, phone, current_position, years_of_experience, skills, status, score)
VALUES 
    ('Sarah', 'Johnson', 'sarah.johnson@email.com', '555-0101', 'Senior Developer', 7, 
     ARRAY['React', 'TypeScript', 'Node.js', 'AWS'], 'shortlisted', 92),
    ('Michael', 'Chen', 'michael.chen@email.com', '555-0102', 'Product Manager', 5, 
     ARRAY['Product Strategy', 'Agile', 'Jira', 'Analytics'], 'shortlisted', 88),
    ('Emily', 'Rodriguez', 'emily.rodriguez@email.com', '555-0103', 'UX Designer', 4, 
     ARRAY['Figma', 'User Research', 'Prototyping', 'Design Systems'], 'pending', 85),
    ('David', 'Kim', 'david.kim@email.com', '555-0104', 'Data Scientist', 6, 
     ARRAY['Python', 'Machine Learning', 'SQL', 'TensorFlow'], 'shortlisted', 90),
    ('Jessica', 'Taylor', 'jessica.taylor@email.com', '555-0105', 'Marketing Lead', 8, 
     ARRAY['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics'], 'pending', 78);

-- Create a view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM candidates) as total_candidates,
    (SELECT COUNT(*) FROM candidates WHERE status = 'shortlisted') as shortlisted_count,
    (SELECT COUNT(*) FROM candidates WHERE status = 'pending') as pending_review,
    (SELECT ROUND(AVG(score)) FROM candidates WHERE status = 'shortlisted') as avg_success_score,
    (SELECT COUNT(*) FROM job_listings WHERE status = 'active') as active_jobs;

-- Create a view for recent candidates with full details
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

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on job_listings" ON job_listings FOR ALL USING (true);
CREATE POLICY "Allow all operations on candidates" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow all operations on job_applications" ON job_applications FOR ALL USING (true);
CREATE POLICY "Allow all operations on filters" ON filters FOR ALL USING (true);
CREATE POLICY "Allow all operations on activity_log" ON activity_log FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
