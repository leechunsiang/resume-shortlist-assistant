'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useOrganization } from '@/contexts/organization-context';
import { authApi } from '@/lib/supabase';
import { 
  getUserUsageSummary, 
  getOrganizationUsageSummary,
  getUserRecentLogs,
  formatCost,
  formatTokens,
  exportUsageLogsToCSV,
  UsageSummary
} from '@/lib/api-usage';
import { useRouter } from 'next/navigation';
import { Download, TrendingUp, Zap, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApiUsagePage() {
  const router = useRouter();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [userSummary, setUserSummary] = useState<UsageSummary | null>(null);
  const [orgSummary, setOrgSummary] = useState<UsageSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const user = await authApi.getCurrentUser();
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function fetchUsageData() {
      if (!userId || !currentOrganization || orgLoading) return;

      setLoading(true);
      try {
        const days = parseInt(timeRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();

        // Fetch user summary
        const userSum = await getUserUsageSummary(userId, startDate, endDate);
        setUserSummary(userSum);

        // Fetch organization summary
        const orgSum = await getOrganizationUsageSummary(currentOrganization.id, startDate, endDate);
        setOrgSummary(orgSum);

        // Fetch recent logs
        const logs = await getUserRecentLogs(userId, 50);
        setRecentLogs(logs);
      } catch (error) {
        console.error('Error fetching usage data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsageData();
  }, [userId, currentOrganization, orgLoading, timeRange]);

  const handleExport = () => {
    const csv = exportUsageLogsToCSV(recentLogs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (orgLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading usage data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        {/* Migration Notice */}
        {!userSummary && !orgSummary && recentLogs.length === 0 && (
          <div className="mx-8 mt-6 mb-4">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-400 text-xs">!</span>
                </div>
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-1">Database Migration Required</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    The API usage tracking database tables haven't been created yet. 
                    To enable usage tracking, apply the migration in Supabase.
                  </p>
                  <p className="text-gray-400 text-xs">
                    See <code className="bg-gray-800 px-1.5 py-0.5 rounded">APPLY_API_USAGE_MIGRATION.md</code> for instructions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <header className="bg-transparent px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">API Usage</h1>
              <p className="text-gray-400">Monitor OpenAI API usage and costs</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7' | '30' | '90')}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <button
                onClick={handleExport}
                disabled={recentLogs.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Personal Usage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {userSummary?.totalRequests || 0}
              </h3>
              <p className="text-gray-400 text-sm">Your Requests</p>
            </motion.div>

            {/* Personal Tokens */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {formatTokens(userSummary?.totalTokens || 0)}
              </h3>
              <p className="text-gray-400 text-sm">Your Tokens</p>
            </motion.div>

            {/* Personal Cost */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {formatCost(userSummary?.totalCost || 0)}
              </h3>
              <p className="text-gray-400 text-sm">Your Cost</p>
            </motion.div>

            {/* Organization Cost */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {formatCost(orgSummary?.totalCost || 0)}
              </h3>
              <p className="text-gray-400 text-sm">Organization Cost</p>
            </motion.div>
          </div>

          {/* Recent Logs Table */}
          <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Recent API Calls</h2>
            
            {recentLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No API usage yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 font-medium py-3 px-4">Date</th>
                      <th className="text-left text-gray-400 font-medium py-3 px-4">Endpoint</th>
                      <th className="text-right text-gray-400 font-medium py-3 px-4">Tokens</th>
                      <th className="text-right text-gray-400 font-medium py-3 px-4">Cost</th>
                      <th className="text-right text-gray-400 font-medium py-3 px-4">Time (ms)</th>
                      <th className="text-center text-gray-400 font-medium py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {log.endpoint.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          {formatTokens(log.total_tokens)}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          {formatCost(log.total_cost)}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm text-right">
                          {log.response_time_ms || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {log.success ? (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                              Success
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Endpoint Breakdown */}
          {userSummary?.byEndpoint && (
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Usage by Endpoint</h2>
              <div className="space-y-4">
                {Object.entries(userSummary.byEndpoint).map(([endpoint, data]) => (
                  <div key={endpoint} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-300 text-sm">{endpoint.replace(/_/g, ' ')}</span>
                        <span className="text-gray-400 text-xs">{data.requests} requests</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${((data.cost / (userSummary.totalCost || 1)) * 100).toFixed(1)}%`
                          }}
                        />
                      </div>
                    </div>
                    <span className="ml-4 text-gray-300 text-sm font-medium">
                      {formatCost(data.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
