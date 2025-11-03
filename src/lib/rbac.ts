// Role-Based Access Control (RBAC) Utility
// Manages user roles and permissions

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
