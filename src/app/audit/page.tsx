'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { getAuditLogs } from '@/lib/audit';
import { authApi, organizationsApi } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { exportAuditLogsTOCSV } from '@/lib/export';
import { Download, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        
        // Get current user
        const user = await authApi.getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Get organization
        const orgs = await organizationsApi.getUserOrganizations(user.id);
        if (!orgs || orgs.length === 0) {
          router.push('/organization/setup');
          return;
        }

        const orgId = orgs[0].id;
        setOrganizationId(orgId);

        // Fetch audit logs
        const auditLogs = await getAuditLogs(orgId, {
          limit: 100,
        });

        setLogs(auditLogs || []);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [router]);

  const handleExportCSV = () => {
    exportAuditLogsTOCSV(logs);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'update':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delete':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'view':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'export':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatActionText = (action: string) => {
    if (action === 'export') return 'Download';
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Audit Trail</h1>
            <p className="text-gray-400">Track all user actions and system events</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="view">View</option>
                <option value="export">Download</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resource Type
              </label>
              <select
                value={filters.resourceType}
                onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Resources</option>
                <option value="job">Jobs</option>
                <option value="candidate">Candidates</option>
                <option value="user">Users</option>
                <option value="role">Roles</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
                          {formatActionText(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>
                          <div className="font-medium">{log.resource_type}</div>
                          {log.resource_id && (
                            <div className="text-xs text-gray-500">{log.resource_id.slice(0, 8)}...</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        {log.user_id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-indigo-400 hover:text-indigo-300">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-600">No details</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
