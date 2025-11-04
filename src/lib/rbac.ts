// Role-Based Access Control (RBAC) Utility
// Manages user roles and permissions

import { supabase } from './supabase';

export type RoleName = 'admin' | 'recruiter' | 'viewer';

export interface Role {
  id: string;
  name: RoleName;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface UserRole {
  user_id: string;
  organization_id: string;
  role_id: string;
  role: Role;
}

/**
 * Get user's role in an organization
 */
export async function getUserRole(userId: string, organizationId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data as any;
  } catch (err) {
    console.error('Failed to get user role:', err);
    return null;
  }
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission:permissions(*)
      `)
      .eq('role_id', roleId);

    if (error) throw error;

    return data.map((rp: any) => rp.permission) as Permission[];
  } catch (err) {
    console.error('Failed to get role permissions:', err);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  permissionName: string
): Promise<boolean> {
  try {
    // Get user's role
    const userRole = await getUserRole(userId, organizationId);
    if (!userRole) return false;

    // Admins have all permissions
    if (userRole.role.name === 'admin') return true;

    // Get role's permissions
    const permissions = await getRolePermissions(userRole.role_id);

    // Check if permission exists
    return permissions.some(p => p.name === permissionName);
  } catch (err) {
    console.error('Permission check failed:', err);
    return false;
  }
}

/**
 * Check if user can perform an action on a resource
 */
export async function canPerformAction(
  userId: string,
  organizationId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const permissionName = `${resource}.${action}`;
  return hasPermission(userId, organizationId, permissionName);
}

/**
 * Assign role to user
 */
export async function assignRole(
  userId: string,
  organizationId: string,
  roleName: RoleName,
  assignedBy: string
): Promise<boolean> {
  try {
    // Get role ID
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();

    if (roleError) throw roleError;

    // Assign role
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        organization_id: organizationId,
        role_id: role.id,
        assigned_by: assignedBy,
      });

    if (error) throw error;

    return true;
  } catch (err) {
    console.error('Failed to assign role:', err);
    return false;
  }
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) throw error;

    return data as Role[];
  } catch (err) {
    console.error('Failed to fetch roles:', err);
    return [];
  }
}

/**
 * React hook for permission checking
 */
export function usePermission() {
  const checkPermission = async (
    permissionName: string,
    organizationId?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      let orgId = organizationId;
      if (!orgId) {
        // Get user's organization
        const { data: orgs } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!orgs) return false;
        orgId = orgs.organization_id;
      }

      if (!orgId) return false;

      return hasPermission(user.id, orgId, permissionName);
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  };

  const checkAction = async (
    resource: string,
    action: string,
    organizationId?: string
  ): Promise<boolean> => {
    const permissionName = `${resource}.${action}`;
    return checkPermission(permissionName, organizationId);
  };

  return { checkPermission, checkAction };
}

/**
 * Higher-order function to protect API routes
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  permissionName: string
): Promise<{ authorized: boolean; error?: string }> {
  const authorized = await hasPermission(userId, organizationId, permissionName);

  if (!authorized) {
    return {
      authorized: false,
      error: 'Insufficient permissions to perform this action',
    };
  }

  return { authorized: true };
}

// Simple cache for organization roles to prevent repeated DB queries
const roleCache = new Map<string, { role: string; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Get user's organization role (owner, admin, member, viewer) with caching
 */
export async function getOrganizationRole(
  userId: string,
  organizationId: string
): Promise<string | null> {
  try {
    const cacheKey = `${userId}-${organizationId}`;
    const cached = roleCache.get(cacheKey);
    
    // Return cached role if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.role;
    }

    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      roleCache.delete(cacheKey);
      return null;
    }

    // Cache the result
    roleCache.set(cacheKey, {
      role: data.role,
      timestamp: Date.now(),
    });

    return data.role;
  } catch (err) {
    console.error('Failed to get organization role:', err);
    return null;
  }
}

/**
 * Check if user has a specific organization role
 */
export async function hasOrganizationRole(
  userId: string,
  organizationId: string,
  roles: string | string[]
): Promise<boolean> {
  try {
    const userRole = await getOrganizationRole(userId, organizationId);
    if (!userRole) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(userRole);
  } catch (err) {
    console.error('Role check failed:', err);
    return false;
  }
}

/**
 * Require specific organization role (for API routes)
 */
export async function requireRole(
  userId: string,
  organizationId: string,
  roles: string | string[]
): Promise<{ authorized: boolean; error?: string; role?: string }> {
  const userRole = await getOrganizationRole(userId, organizationId);

  if (!userRole) {
    return {
      authorized: false,
      error: 'User is not a member of this organization',
    };
  }

  const roleArray = Array.isArray(roles) ? roles : [roles];
  const authorized = roleArray.includes(userRole);

  if (!authorized) {
    return {
      authorized: false,
      error: `This action requires one of the following roles: ${roleArray.join(', ')}`,
      role: userRole,
    };
  }

  return { authorized: true, role: userRole };
}

/**
 * Get permissions map for a role based on organization role
 */
export function getOrganizationRolePermissions(role: string): string[] {
  const permissionsMap: Record<string, string[]> = {
    owner: [
      // All permissions
      'jobs.create', 'jobs.read', 'jobs.update', 'jobs.delete', 'jobs.export',
      'candidates.create', 'candidates.read', 'candidates.update', 'candidates.delete', 'candidates.export',
      'users.manage', 'settings.manage', 'audit.view', 'ai.shortlist',
      'organization.delete', 'organization.transfer',
    ],
    admin: [
      // All except organization transfer/delete
      'jobs.create', 'jobs.read', 'jobs.update', 'jobs.delete', 'jobs.export',
      'candidates.create', 'candidates.read', 'candidates.update', 'candidates.delete', 'candidates.export',
      'users.manage', 'settings.manage', 'audit.view', 'ai.shortlist',
    ],
    member: [
      // Standard CRUD for jobs and candidates
      'jobs.create', 'jobs.read', 'jobs.update', 'jobs.delete', 'jobs.export',
      'candidates.create', 'candidates.read', 'candidates.update', 'candidates.delete', 'candidates.export',
      'ai.shortlist',
    ],
    viewer: [
      // Read-only
      'jobs.read', 'candidates.read',
    ],
  };

  return permissionsMap[role] || [];
}

/**
 * Check permission based on organization role
 */
export async function checkRolePermission(
  userId: string,
  organizationId: string,
  permission: string
): Promise<boolean> {
  try {
    const userRole = await getOrganizationRole(userId, organizationId);
    if (!userRole) return false;

    const permissions = getOrganizationRolePermissions(userRole);
    return permissions.includes(permission);
  } catch (err) {
    console.error('Permission check failed:', err);
    return false;
  }
}

/**
 * Clear the role cache (useful after role changes or logout)
 */
export function clearRoleCache() {
  roleCache.clear();
}

/**
 * React hook for role-based checks
 */
export function useRole(organizationId?: string) {
  const checkRole = async (roles: string | string[]): Promise<boolean> => {
    try {
      // Use getSession() instead of getUser() - it's cached and doesn't make a network request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      let orgId = organizationId;
      if (!orgId) {
        // Get from localStorage first (fast)
        const stored = localStorage.getItem('selectedOrganizationId');
        if (stored) {
          orgId = stored;
        } else {
          const { data: orgs } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .limit(1)
            .single();

          if (!orgs) return false;
          orgId = orgs.organization_id;
        }
      }

      if (!orgId) return false;

      return hasOrganizationRole(session.user.id, orgId, roles);
    } catch (err) {
      console.error('Role check failed:', err);
      return false;
    }
  };

  const isOwner = () => checkRole('owner');
  const isAdmin = () => checkRole('admin');
  const isMember = () => checkRole('member');
  const isViewer = () => checkRole('viewer');
  const hasRole = (roles: string | string[]) => checkRole(roles);

  return { isOwner, isAdmin, isMember, isViewer, hasRole, checkRole };
}

/**
 * React hook for permission checks based on organization role
 */
export function usePermissions(organizationId?: string) {
  const can = async (permission: string): Promise<boolean> => {
    try {
      // Use getSession() instead of getUser() - it's cached and doesn't make a network request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return false;

      let orgId = organizationId;
      if (!orgId) {
        // Get from localStorage first (fast)
        const stored = localStorage.getItem('selectedOrganizationId');
        if (stored) {
          orgId = stored;
        } else {
          const { data: orgs } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .eq('status', 'active')
            .limit(1)
            .single();

          if (!orgs) return false;
          orgId = orgs.organization_id;
        }
      }

      if (!orgId) return false;

      return checkRolePermission(session.user.id, orgId, permission);
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  };

  const canAny = async (permissions: string[]): Promise<boolean> => {
    const results = await Promise.all(permissions.map(p => can(p)));
    return results.some(r => r);
  };

  const canAll = async (permissions: string[]): Promise<boolean> => {
    const results = await Promise.all(permissions.map(p => can(p)));
    return results.every(r => r);
  };

  return { can, canAny, canAll };
}
