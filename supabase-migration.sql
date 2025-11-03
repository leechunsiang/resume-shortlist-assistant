-- Resume Shortlist Assistant Database Schema - MIGRATION
-- This script will update existing tables to add organization support
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create new tables first (organizations and members)

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

-- Step 2: Add organization_id columns to existing tables (if they don't exist)

-- Add to job_listings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='job_listings' AND column_name='organization_id'
    ) THEN
        ALTER TABLE job_listings ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        ALTER TABLE job_listings ADD COLUMN created_by VARCHAR(255);
    END IF;
END $$;

-- Add to candidates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='candidates' AND column_name='organization_id'
    ) THEN
        ALTER TABLE candidates ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        ALTER TABLE candidates ADD COLUMN created_by VARCHAR(255);
        -- Drop the old UNIQUE constraint on email and add new one with organization_id
        ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_email_key;
    END IF;
END $$;

-- Add to filters
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='filters' AND column_name='organization_id'
    ) THEN
        ALTER TABLE filters ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add to activity_log
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='activity_log' AND column_name='organization_id'
    ) THEN
        ALTER TABLE activity_log ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Add unique constraint for candidates (email unique per organization)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'candidates_organization_id_email_key'
    ) THEN
        ALTER TABLE candidates ADD CONSTRAINT candidates_organization_id_email_key UNIQUE(organization_id, email);
    END IF;
END $$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_job_listings_organization_id ON job_listings(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_filters_organization_id ON filters(organization_id);

-- Step 5: Update triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for organization_members
DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Clean up any test data without organization_id
-- WARNING: This will delete existing data that doesn't have an organization_id
-- Comment out these lines if you want to keep your test data

-- DELETE FROM job_applications WHERE job_id IN (SELECT id FROM job_listings WHERE organization_id IS NULL);
-- DELETE FROM job_listings WHERE organization_id IS NULL;
-- DELETE FROM candidates WHERE organization_id IS NULL;
-- DELETE FROM filters WHERE organization_id IS NULL;
-- DELETE FROM activity_log WHERE organization_id IS NULL;

-- Migration complete!
-- Your database is now ready for multi-tenant organization support.
