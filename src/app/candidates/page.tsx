'use client';

import { useEffect, useState } from 'react';
import { candidatesApi, authApi, type Candidate } from '@/lib/supabase';
import { useOrganization } from '@/contexts/organization-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import TextType from '@/components/text-type';
import { useRipple, RippleEffect } from '@/components/ripple-effect';
import { AnimatedCounter, PulseStatusBadge } from '@/components/animated-counter';
import { GlassButton } from '@/components/ui/glass-button';
import { exportCandidatesToCSV, exportCandidatesToPDF, exportCandidatesReportWithChart } from '@/lib/export';
import { Download, FileText, Lock, Trash2 } from 'lucide-react';
import { usePermissions, useRole } from '@/lib/rbac';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { AlertDialog } from '@/components/alert-dialog';

interface JobApplication {
  id: string;
  job_id: string;
  match_score: number;
  status: string;
  ai_analysis: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendation?: string;
    keySkillsMatch?: string[];
    experienceMatch?: string;
    educationMatch?: string;
  };
  applied_at: string;
  job_listings: {
    title: string;
    department: string;
    employment_type: string;
  };
}

interface CandidateWithJobs extends Candidate {
  job_applications?: JobApplication[];
}

export default function CandidatesPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const { isViewer } = useRole();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [candidates, setCandidates] = useState<CandidateWithJobs[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithJobs | null>(null);
  const [candidateApplications, setCandidateApplications] = useState<JobApplication[]>([]);
  const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '' });
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedJobForOverride, setSelectedJobForOverride] = useState<string | null>(null);
  
  // RBAC permissions
  const [canExport, setCanExport] = useState(false);
  const [isViewerRole, setIsViewerRole] = useState(false);
  
  // Ripple effects for stat cards
  const totalCandidatesRipple = useRipple();
  const shortlistedRipple = useRipple();
  const rejectedRipple = useRipple();
  const overriddenRipple = useRipple();

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      // Wait for organization to be loaded
      if (orgLoading || !currentOrganization) {
        return;
      }

      const [exp, viewer] = await Promise.all([
        can('candidates.export'),
        isViewer(),
      ]);
      
      console.log('[CANDIDATES] Permissions:', { exp, viewer });
      
      setCanExport(exp);
      setIsViewerRole(viewer);
    };

    checkPermissions();
  }, [can, isViewer, currentOrganization, orgLoading]);

  useEffect(() => {
    async function fetchCandidates() {
      // Wait for organization context to load
      if (orgLoading) {
        console.log('[CANDIDATES] Waiting for organization context...');
        setLoading(false);
        return;
      }

      // Check if user is authenticated
      const user = await authApi.getCurrentUser();
      if (!user) {
        console.log('[CANDIDATES] No user found, redirecting to login');
        router.push('/login');
        return;
      }

      // Check if organization is selected
      if (!currentOrganization) {
        console.log('[CANDIDATES] No organization selected, redirecting to setup');
        router.push('/organization/setup');
        return;
      }

      // Fetch data for the current organization
      try {
        setLoading(true);
        setError(null);

        console.log('[CANDIDATES] Fetching data for organization:', currentOrganization.name, currentOrganization.id);
        setOrganizationId(currentOrganization.id);

        // Fetch candidates with their job applications
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select(`
            *,
            job_applications (
              id,
              job_id,
              match_score,
              applied_at,
              job_listings (
                title,
                department,
                employment_type
              )
            )
          `)
          .eq('organization_id', currentOrganization.id)
          .order('created_at', { ascending: false });

        if (candidatesError) {
          console.error('[CANDIDATES] Error fetching candidates:', candidatesError);
          throw candidatesError;
        }

        console.log('[CANDIDATES] Fetched', candidatesData?.length || 0, 'candidates');
        setCandidates(candidatesData || []);
      } catch (err) {
        console.error('[CANDIDATES] Error fetching candidates:', err);
        setError('Failed to connect to database. Please check your Supabase configuration.');
      } finally {
        setLoading(false);
      }
    }

    // Only fetch if we have a current organization and context is not loading
    if (!orgLoading && currentOrganization) {
      fetchCandidates();
    }
  }, [currentOrganization?.id]); // Only depend on organization ID


  // Fetch job applications for selected candidate
  const fetchCandidateApplications = async (candidateId: string) => {
    setLoadingApplications(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_listings (
            title,
            department,
            employment_type
          )
        `)
        .eq('candidate_id', candidateId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setCandidateApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCurrentApplicationIndex(0); // Reset to first application
    fetchCandidateApplications(candidate.id);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) throw error;

      // Update local state
      setCandidates(candidates.filter(c => c.id !== candidateId));
      setSelectedCandidate(null);
      
      console.log('[CANDIDATES] Successfully deleted candidate:', candidateId);
    } catch (error) {
      console.error('[CANDIDATES] Error deleting candidate:', error);
      setAlertMessage({
        title: 'Delete Failed',
        message: 'Failed to delete candidate. Please try again.',
      });
      setAlertDialogOpen(true);
    }
  };

  const openDeleteDialog = (candidateId: string) => {
    setCandidateToDelete(candidateId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (candidateToDelete) {
      handleDeleteCandidate(candidateToDelete);
      setCandidateToDelete(null);
    }
  };

  const handleOverrideStatus = async (jobId: string) => {
    if (!selectedCandidate) return;
    
    try {
      // Update the specific job application status to 'shortlisted'
      const { error } = await supabase
        .from('job_applications')
        .update({ status: 'shortlisted' })
        .eq('candidate_id', selectedCandidate.id)
        .eq('job_id', jobId);

      if (error) throw error;

      // Refresh applications
      await fetchCandidateApplications(selectedCandidate.id);
      
      // Refresh candidates list
      const { data: updatedCandidates } = await supabase
        .from('candidates')
        .select(`
          *,
          job_applications (
            id,
            job_id,
            match_score,
            status,
            applied_at,
            job_listings (
              title,
              department,
              employment_type
            )
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (updatedCandidates) {
        setCandidates(updatedCandidates);
        const updated = updatedCandidates.find(c => c.id === selectedCandidate.id);
        if (updated) {
          setSelectedCandidate(updated);
        }
      }

      setOverrideDialogOpen(false);
      setSelectedJobForOverride(null);
    } catch (error) {
      console.error('Error overriding status:', error);
      setAlertMessage({
        title: 'Override Failed',
        message: 'Failed to override status. Please try again.',
      });
      setAlertDialogOpen(true);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'rejected':
        return 'text-red-400 bg-red-500/10';
      case 'overridden':
        return 'text-purple-400 bg-purple-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-400';
    if (score >= 70) return 'bg-blue-400';
    if (score >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const filteredCandidates = candidates
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c => {
      if (!searchQuery.trim()) return true;
      
      // Split search query into individual words
      const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
      
      // Combine all searchable fields into one string
      const appliedPositions = c.job_applications?.map(app => 
        app.job_listings?.title || ''
      ).join(' ') || '';
      
      const searchableText = [
        c.first_name || '',
        c.last_name || '',
        c.email || '',
        c.phone || '',
        appliedPositions
      ].join(' ').toLowerCase();
      
      // Check if ALL search words are present (in any order)
      return searchWords.every(word => searchableText.includes(word));
    });

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    overridden: candidates.filter(c => c.status === 'overridden').length,
  };

  return (
    <DashboardLayout>
      {/* Show loading state while organization context is loading */}
      {orgLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading organization...</p>
          </div>
        </div>
      ) : (
        <>
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-transparent px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                <TextType 
                  text="Candidates"
                  speed={50}
                  cursor={true}
                  cursorChar="|"
                />
              </h1>
              <p className="text-gray-400">Review and manage candidate applications</p>
            </div>
            <div className="flex items-center gap-3">
              {canExport && (
                <div className="relative">
                  <button
                    onClick={() => setExportMenuOpen((v) => !v)}
                    onBlur={(e) => {
                      // Close menu when clicking outside
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setTimeout(() => setExportMenuOpen(false), 150);
                      }
                    }}
                    disabled={candidates.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>

                  <AnimatePresence>
                    {exportMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-1 z-[60]"
                        onMouseLeave={() => setExportMenuOpen(false)}
                      >
                        <button
                          onClick={() => {
                            exportCandidatesReportWithChart(candidates as any);
                            setExportMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm text-white transition-colors flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Report with Chart
                        </button>
                        <button
                          onClick={() => {
                            exportCandidatesToCSV(candidates as any);
                            setExportMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm text-white transition-colors"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => {
                            exportCandidatesToPDF(candidates as any);
                            setExportMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm text-white transition-colors"
                        >
                          PDF
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {isViewerRole && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>View Only</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Stats & Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              <p className="font-semibold mb-1">Connection Error</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2">Please configure your Supabase credentials in .env.local</p>
            </div>
          )}

          {(loading || orgLoading) ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="text-gray-400 mt-4">Loading candidates...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onClick={(e) => totalCandidatesRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 hover:border-emerald-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={totalCandidatesRipple.ripples} color="rgba(16, 185, 129, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-emerald-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats.total} duration={1.5} delay={0.2} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Total Candidates</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  onClick={(e) => shortlistedRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 hover:border-emerald-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={shortlistedRipple.ripples} color="rgba(16, 185, 129, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-emerald-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats.shortlisted} duration={1.5} delay={0.3} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Shortlisted</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  onClick={(e) => rejectedRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-1 hover:border-red-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={rejectedRipple.ripples} color="rgba(239, 68, 68, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-red-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-red-500/30 shadow-lg shadow-red-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-red-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats.rejected} duration={1.5} delay={0.4} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Rejected</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  onClick={(e) => overriddenRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={overriddenRipple.ripples} color="rgba(168, 85, 247, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-purple-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats.overridden} duration={1.5} delay={0.5} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Overridden</p>
                </motion.div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'all'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  All ({candidates.length})
                </button>
                <button
                  onClick={() => setFilterStatus('shortlisted')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'shortlisted'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Shortlisted ({stats.shortlisted})
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'rejected'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Rejected ({stats.rejected})
                </button>
                <button
                  onClick={() => setFilterStatus('overridden')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'overridden'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Overridden ({stats.overridden})
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative w-full max-w-[500px]">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or applied position..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all [&:not(:placeholder-shown)]:max-sm:pr-12"
                  />
                  <button
                    onClick={() => {
                      const inputs = document.querySelectorAll('input[type="text"]');
                      const searchInput = Array.from(inputs).find(input => 
                        input.getAttribute('placeholder')?.includes('name, email')
                      ) as HTMLInputElement;
                      if (searchInput) searchInput.focus();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors"
                    aria-label="Search"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {searchQuery && (
                <p className="mb-6 text-sm text-gray-400">
                  Found {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'} matching "{searchQuery}"
                </p>
              )}

              {/* Candidates List */}
              {filteredCandidates.length === 0 ? (
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center shadow-lg shadow-black/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="relative z-10">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-400 text-lg font-medium drop-shadow-md">
                      {searchQuery ? `No candidates found matching "${searchQuery}"` : 'No candidates found'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {searchQuery ? 'Try adjusting your search terms' : 'Upload resumes to get started'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCandidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      onClick={() => handleCandidateClick(candidate)}
                      className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer shadow-lg shadow-black/10 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Avatar */}
                          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 border-2 border-emerald-400/30 shadow-lg shadow-emerald-500/20">
                            {getInitials(candidate.first_name, candidate.last_name)}
                          </div>

                          {/* Candidate Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-xl font-bold text-white drop-shadow-md">
                                {candidate.first_name} {candidate.last_name}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getStatusColor(candidate.status)}`}>
                                {getStatusLabel(candidate.status)}
                              </span>
                            </div>
                            
                            {/* Show applied jobs with shortlist indicators */}
                            {candidate.job_applications && candidate.job_applications.length > 0 ? (
                              <div className="mb-2">
                                <p className="text-emerald-400 text-sm font-medium mb-1 drop-shadow-md">
                                  Applied to {candidate.job_applications.length} {candidate.job_applications.length === 1 ? 'position' : 'positions'}
                                  {(() => {
                                    const shortlistedCount = candidate.job_applications.filter(app => app.status === 'shortlisted').length;
                                    if (shortlistedCount > 0) {
                                      return ` • Shortlisted for ${shortlistedCount}`;
                                    }
                                    return '';
                                  })()}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {candidate.job_applications.slice(0, 3).map((app, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-1 rounded text-xs border backdrop-blur-sm shadow-lg flex items-center gap-1 ${
                                        app.status === 'shortlisted' 
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20' 
                                          : app.status === 'rejected'
                                          ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10'
                                          : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                      }`}
                                    >
                                      {/* Show tick for shortlisted jobs, cross for rejected, nothing for others */}
                                      {app.status === 'shortlisted' && (
                                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                      {app.status === 'rejected' && (
                                        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                      <span>{app.job_listings.title}</span>
                                      <span className="text-[10px] opacity-75">({app.match_score || 0})</span>
                                    </span>
                                  ))}
                                  {candidate.job_applications.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-700/50 text-gray-400 rounded text-xs backdrop-blur-sm border border-gray-600/30">
                                      +{candidate.job_applications.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm mb-2 italic">
                                No applications yet
                              </p>
                            )}
                            
                            {candidate.email && (
                              <p className="text-gray-400 text-sm flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {candidate.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Score: show highest score among all job applications */}
                        <div className="text-right ml-4">
                          {(() => {
                            // Find the highest score among all job applications
                            const maxScore = candidate.job_applications && candidate.job_applications.length > 0
                              ? Math.max(...candidate.job_applications.map(app => app.match_score || 0))
                              : 0;
                            return (
                              <>
                                <p className={`text-4xl font-bold mb-2 drop-shadow-lg ${getScoreColor(maxScore)}`}>
                                  {maxScore}%
                                </p>
                                <p className="text-gray-400 text-sm mb-3">Score</p>
                                <div className="w-32 h-2 bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden border border-gray-600/30 shadow-inner">
                                  <div
                                    className={`h-full ${getProgressBarColor(maxScore)} transition-all shadow-lg`}
                                    style={{ width: `${maxScore}%` }}
                                  ></div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-gradient-to-br from-gray-900 to-black border-l border-gray-700 z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-black/95 backdrop-blur-sm border-b border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {getInitials(selectedCandidate.first_name, selectedCandidate.last_name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedCandidate.first_name} {selectedCandidate.last_name}
                    </h2>
                    <p className="text-emerald-400">
                      {selectedCandidate.current_position || 'Position not specified'}
                    </p>
                    {/* Status Badge */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm border ${getStatusColor(selectedCandidate.status)}`}>
                        {getStatusLabel(selectedCandidate.status)}
                      </span>
                      {/* Override Button for Rejected Candidates */}
                      {candidateApplications.some(app => app.status === 'rejected') && !isViewerRole && (
                        <button
                          onClick={() => {
                            const rejectedApps = candidateApplications.filter(app => app.status === 'rejected');
                            if (rejectedApps.length === 1) {
                              // Direct override for single rejected application
                              handleOverrideStatus(rejectedApps[0].job_id);
                            } else {
                              // Open dialog to select which job to override
                              setOverrideDialogOpen(true);
                            }
                          }}
                          className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Override
                        </button>
                      )}
                      {/* Delete Button - Always visible for non-viewers */}
                      {!isViewerRole && (
                        <button
                          onClick={() => openDeleteDialog(selectedCandidate.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-all duration-200 flex items-center justify-center group"
                          title="Delete candidate"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Contact Information */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {selectedCandidate.email && (
                      <div className="flex items-center text-gray-300">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {selectedCandidate.email}
                      </div>
                    )}
                    {selectedCandidate.phone && (
                      <div className="flex items-center text-gray-300">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedCandidate.phone}
                      </div>
                    )}
                    {selectedCandidate.years_of_experience !== null && (
                      <div className="flex items-center text-gray-300">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {selectedCandidate.years_of_experience} years experience
                      </div>
                    )}
                    {selectedCandidate.education && (
                      <div className="flex items-center text-gray-300">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                        {selectedCandidate.education}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm border border-emerald-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Applications & AI Summaries with Swipeable Navigation */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Job Applications
                    </h3>
                    
                    {/* Navigation Controls for Multiple Applications */}
                    {candidateApplications.length > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentApplicationIndex(Math.max(0, currentApplicationIndex - 1))}
                          disabled={currentApplicationIndex === 0}
                          className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Previous application"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        
                        <span className="text-sm text-gray-400 px-2">
                          {currentApplicationIndex + 1} / {candidateApplications.length}
                        </span>
                        
                        <button
                          onClick={() => setCurrentApplicationIndex(Math.min(candidateApplications.length - 1, currentApplicationIndex + 1))}
                          disabled={currentApplicationIndex === candidateApplications.length - 1}
                          className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Next application"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {loadingApplications ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                  ) : candidateApplications.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
                      <p className="text-gray-400">No job applications found</p>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentApplicationIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
                      >
                        {(() => {
                          const application = candidateApplications[currentApplicationIndex];
                          return (
                            <>
                              {/* Job Title & Match Score Card */}
                              <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-2xl p-6 border border-emerald-500/30 mb-4">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-xl font-bold text-white mb-1">
                                      {application.job_listings.title}
                                    </h4>
                                    <p className="text-sm text-gray-400">
                                      {application.job_listings.department} • {application.job_listings.employment_type}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Applied {new Date(application.applied_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Match Score Visualization */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm text-gray-400 mb-1">Match Score for This Position</p>
                                    <p className={`text-5xl font-bold ${getScoreColor(application.match_score || 0)}`}>
                                      {application.match_score || 0}
                                    </p>
                                    <p className="text-gray-400 mt-1 text-sm">out of 100</p>
                                  </div>
                                  <div className="w-28 h-28">
                                    <svg className="transform -rotate-90" viewBox="0 0 120 120">
                                      <circle
                                        cx="60"
                                        cy="60"
                                        r="54"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-gray-700"
                                      />
                                      <circle
                                        cx="60"
                                        cy="60"
                                        r="54"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        strokeDasharray={`${(application.match_score || 0) * 3.39} 339`}
                                        className={getScoreColor(application.match_score || 0).replace('text-', 'text-')}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* AI Summary */}
                              {application.ai_analysis && (
                                <div className="space-y-4">
                                  {/* Summary */}
                                  {application.ai_analysis.summary && (
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                      <h5 className="text-sm font-semibold text-emerald-400 mb-2">AI Summary</h5>
                                      <p className="text-gray-300 text-sm leading-relaxed">
                                        {application.ai_analysis.summary}
                                      </p>
                                    </div>
                                  )}

                                  {/* Strengths */}
                                  {application.ai_analysis.strengths && application.ai_analysis.strengths.length > 0 && (
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                      <h5 className="text-sm font-semibold text-emerald-400 mb-2">Strengths</h5>
                                      <ul className="space-y-1">
                                        {application.ai_analysis.strengths.map((strength, idx) => (
                                          <li key={idx} className="text-gray-300 text-sm flex items-start">
                                            <svg className="w-4 h-4 mr-2 mt-0.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {strength}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Weaknesses */}
                                  {application.ai_analysis.weaknesses && application.ai_analysis.weaknesses.length > 0 && (
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                      <h5 className="text-sm font-semibold text-emerald-400 mb-2">Areas for Development</h5>
                                      <ul className="space-y-1">
                                        {application.ai_analysis.weaknesses.map((weakness, idx) => (
                                          <li key={idx} className="text-gray-300 text-sm flex items-start">
                                            <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            {weakness}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Skills Match */}
                                  {application.ai_analysis.keySkillsMatch && application.ai_analysis.keySkillsMatch.length > 0 && (
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                      <h5 className="text-sm font-semibold text-blue-400 mb-2">Matching Skills</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {application.ai_analysis.keySkillsMatch.map((skill, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Experience & Education Match */}
                                  {(application.ai_analysis.experienceMatch || application.ai_analysis.educationMatch) && (
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                      <div className="grid grid-cols-2 gap-4">
                                        {application.ai_analysis.experienceMatch && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-gray-400 mb-1">Experience Match</h5>
                                            <p className="text-sm text-gray-300">{application.ai_analysis.experienceMatch}</p>
                                          </div>
                                        )}
                                        {application.ai_analysis.educationMatch && (
                                          <div>
                                            <h5 className="text-xs font-semibold text-gray-400 mb-1">Education Match</h5>
                                            <p className="text-sm text-gray-300">{application.ai_analysis.educationMatch}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recommendation */}
                                  {application.ai_analysis.recommendation && (
                                    <div className="pt-3 border-t border-gray-700">
                                      <p className="text-sm text-gray-400">
                                        Recommendation:{' '}
                                        <span className={`font-semibold ${
                                          application.ai_analysis.recommendation === 'strongly_recommended' ? 'text-emerald-400' :
                                          application.ai_analysis.recommendation === 'recommended' ? 'text-blue-400' :
                                          application.ai_analysis.recommendation === 'maybe' ? 'text-yellow-400' :
                                          'text-red-400'
                                        }`}>
                                          {application.ai_analysis.recommendation.replace('_', ' ').toUpperCase()}
                                        </span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* Resume Text (Collapsible) */}
                {selectedCandidate.resume_text && (
                  <details className="bg-gray-800/50 rounded-2xl border border-gray-700">
                    <summary className="p-6 cursor-pointer hover:bg-gray-800/70 transition-colors">
                      <span className="text-lg font-bold text-white">View Full Resume</span>
                    </summary>
                    <div className="px-6 pb-6">
                      <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-lg overflow-x-auto">
                        {selectedCandidate.resume_text}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Override Job Selection Dialog */}
      <AnimatePresence>
        {overrideDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
            onClick={() => setOverrideDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Override Rejection</h3>
              <p className="text-gray-400 text-sm mb-6">
                This candidate has been rejected for multiple positions. Select which position you want to approve them for:
              </p>
              
              <div className="space-y-3 mb-6">
                {candidateApplications
                  .filter(app => app.status === 'rejected')
                  .map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedJobForOverride(app.job_id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedJobForOverride === app.job_id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">
                            {app.job_listings.title}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {app.job_listings.department} • {app.job_listings.employment_type}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Match Score: <span className={`font-semibold ${getScoreColor(app.match_score || 0)}`}>
                              {app.match_score || 0}
                            </span>
                          </p>
                        </div>
                        {selectedJobForOverride === app.job_id && (
                          <svg className="w-5 h-5 text-purple-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOverrideDialogOpen(false);
                    setSelectedJobForOverride(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedJobForOverride) {
                      handleOverrideStatus(selectedJobForOverride);
                    }
                  }}
                  disabled={!selectedJobForOverride}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                >
                  Override & Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Dialog for Errors */}
      <AlertDialog
        isOpen={alertDialogOpen}
        onClose={() => setAlertDialogOpen(false)}
        title={alertMessage.title}
        message={alertMessage.message}
        variant="error"
      />
        </>
      )}
    </DashboardLayout>
  );
}
