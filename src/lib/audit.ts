// Audit Trail Utility
// Tracks all user actions for compliance and security

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout';
export type ResourceType = 'job' | 'candidate' | 'user' | 'role' | 'organization' | 'settings';

export interface AuditLogEntry {
  user_id: string;
  organization_id: string;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.user_id,
        organization_id: entry.organization_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        details: entry.details || {},
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(
  organizationId: string,
  filters?: {
    userId?: string;
    action?: AuditAction;
    resourceType?: ResourceType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.resourceType) {
      query = query.eq('resource_type', filters.resourceType);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100); // Default limit
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
    throw err;
  }
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: any[]): string {
  if (!logs || logs.length === 0) {
    return 'No data to export';
  }

  const headers = [
    'Timestamp',
    'User ID',
    'Action',
    'Resource Type',
    'Resource ID',
    'Details',
    'IP Address'
  ];

  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.user_id,
    log.action,
    log.resource_type,
    log.resource_id || 'N/A',
    JSON.stringify(log.details || {}),
    log.ip_address || 'N/A'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Hook to automatically log actions (for client-side)
 */
export function useAuditLog() {
  const log = async (
    action: AuditAction,
    resourceType: ResourceType,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: orgs } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!orgs) return;

      // Get client info
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined;

      await logAudit({
        user_id: user.id,
        organization_id: orgs.organization_id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        user_agent: userAgent,
      });
    } catch (err) {
      console.error('Failed to log audit:', err);
    }
  };

  return { log };
}
