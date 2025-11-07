import { supabase } from './supabase';
import { calculateCost } from './api-usage-client';

export interface ApiUsageLog {
  userId: string;
  organizationId: string;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  requestType?: string;
  candidateId?: string;
  jobId?: string;
  success: boolean;
  errorMessage?: string;
  responseTimeMs?: number;
}

export interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byEndpoint?: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byUser?: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

// Re-export calculateCost for backward compatibility
export { calculateCost };

/**
 * Log API usage to Supabase
 */
export async function logApiUsage(log: ApiUsageLog): Promise<void> {
  try {
    const { error } = await supabase
      .from('api_usage_logs')
      .insert({
        user_id: log.userId,
        organization_id: log.organizationId,
        endpoint: log.endpoint,
        model: log.model,
        input_tokens: log.inputTokens,
        output_tokens: log.outputTokens,
        total_tokens: log.totalTokens,
        input_cost: log.inputCost,
        output_cost: log.outputCost,
        total_cost: log.totalCost,
        request_type: log.requestType,
        candidate_id: log.candidateId,
        job_id: log.jobId,
        success: log.success,
        error_message: log.errorMessage,
        response_time_ms: log.responseTimeMs,
      });

    if (error) {
      console.error('[API_USAGE] Failed to log usage:', error);
    } else {
      console.log(`[API_USAGE] Logged ${log.endpoint}: ${log.totalTokens} tokens, $${log.totalCost}`);
    }
  } catch (err) {
    console.error('[API_USAGE] Exception logging usage:', err);
  }
}

/**
 * Get user usage summary
 */
export async function getUserUsageSummary(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary | null> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const { data, error } = await supabase
      .rpc('get_user_usage_summary', {
        p_user_id: userId,
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      });

    if (error) {
      console.error('[API_USAGE] Error fetching user summary:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error('[API_USAGE] Exception fetching user summary:', err);
    return null;
  }
}

/**
 * Get organization usage summary
 */
export async function getOrganizationUsageSummary(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageSummary | null> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const { data, error } = await supabase
      .rpc('get_organization_usage_summary', {
        p_organization_id: organizationId,
        p_start_date: start.toISOString(),
        p_end_date: end.toISOString(),
      });

    if (error) {
      console.error('[API_USAGE] Error fetching org summary:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error('[API_USAGE] Exception fetching org summary:', err);
    return null;
  }
}

/**
 * Get recent API usage logs for a user
 */
export async function getUserRecentLogs(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[API_USAGE] Error fetching recent logs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[API_USAGE] Exception fetching recent logs:', err);
    return [];
  }
}

/**
 * Get usage analytics for a date range
 */
export async function getUsageAnalytics(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('api_usage_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('usage_date', startDate.toISOString().split('T')[0])
      .lte('usage_date', endDate.toISOString().split('T')[0])
      .order('usage_date', { ascending: false });

    if (error) {
      console.error('[API_USAGE] Error fetching analytics:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[API_USAGE] Exception fetching analytics:', err);
    return [];
  }
}

// Re-export client-safe utilities for backward compatibility
export { exportUsageLogsToCSV, formatCost, formatTokens } from './api-usage-client';
