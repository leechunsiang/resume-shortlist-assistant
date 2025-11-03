-- RBAC and Audit Trail Migration
-- This migration adds Role-Based Access Control and Audit Trail functionality

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- e.g., 'jobs', 'candidates', 'settings'
  action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles table (links users to their roles in organizations)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID,
  UNIQUE(user_id, organization_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view', 'export'
  resource_type VARCHAR(50) NOT NULL, -- 'job', 'candidate', 'user', 'role'
  resource_id UUID,
  details JSONB, -- Store additional context like old/new values
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full access to all features and settings'),
  ('recruiter', 'Can manage jobs and candidates, but cannot change settings'),
  ('viewer', 'Read-only access to jobs and candidates')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Job permissions
  ('jobs.create', 'jobs', 'create', 'Create new job listings'),
  ('jobs.read', 'jobs', 'read', 'View job listings'),
  ('jobs.update', 'jobs', 'update', 'Edit job listings'),
  ('jobs.delete', 'jobs', 'delete', 'Delete job listings'),
  ('jobs.export', 'jobs', 'export', 'Export job data'),
  
  -- Candidate permissions
  ('candidates.create', 'candidates', 'create', 'Add new candidates'),
  ('candidates.read', 'candidates', 'read', 'View candidate profiles'),
  ('candidates.update', 'candidates', 'update', 'Edit candidate information'),
  ('candidates.delete', 'candidates', 'delete', 'Delete candidates'),
  ('candidates.export', 'candidates', 'export', 'Export candidate data'),
  
  -- User/Settings permissions
  ('users.manage', 'users', 'manage', 'Manage user accounts and roles'),
  ('settings.manage', 'settings', 'manage', 'Manage organization settings'),
  ('audit.view', 'audit', 'view', 'View audit logs'),
  
  -- AI features
  ('ai.shortlist', 'ai', 'use', 'Use AI shortlisting features')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Recruiter gets job and candidate management, plus AI
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'recruiter'
  AND p.name IN (
    'jobs.create', 'jobs.read', 'jobs.update', 'jobs.delete', 'jobs.export',
    'candidates.create', 'candidates.read', 'candidates.update', 'candidates.delete', 'candidates.export',
    'ai.shortlist'
  )
ON CONFLICT DO NOTHING;

-- Viewer gets read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.name IN ('jobs.read', 'candidates.read')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_org ON user_roles(user_id, organization_id);

-- Create function to automatically assign admin role to organization creator
CREATE OR REPLACE FUNCTION assign_admin_role_to_creator()
RETURNS TRIGGER AS $$
DECLARE
  admin_role_id UUID;
BEGIN
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  -- Assign admin role to the creator
  INSERT INTO user_roles (user_id, organization_id, role_id)
  VALUES (NEW.created_by, NEW.id, admin_role_id)
  ON CONFLICT (user_id, organization_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign admin role
DROP TRIGGER IF EXISTS assign_admin_on_org_create ON organizations;
CREATE TRIGGER assign_admin_on_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION assign_admin_role_to_creator();

-- Add RLS policies for audit logs (only admins can view)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs in their organization"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for roles and permissions (read-only for authenticated users)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Add RLS for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view roles in their organization"
  ON user_roles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE roles IS 'User roles for RBAC (Admin, Recruiter, Viewer)';
COMMENT ON TABLE permissions IS 'Granular permissions for different actions and resources';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles';
COMMENT ON TABLE user_roles IS 'Assigns roles to users within organizations';
COMMENT ON TABLE audit_logs IS 'Tracks all user actions for compliance and security';
