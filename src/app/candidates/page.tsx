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
import { exportCandidatesToCSV, exportCandidatesToPDF } from '@/lib/export';
import { Download, FileText, Lock } from 'lucide-react';
import { usePermissions, useRole } from '@/lib/rbac';

interface JobApplication {
  id: string;
  job_id: string;
  match_score: number;
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
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  
  // RBAC permissions
  const [canExport, setCanExport] = useState(false);
  const [isViewerRole, setIsViewerRole] = useState(false);
  
  // Ripple effects for stat cards
  const totalCandidatesRipple = useRipple();
  const shortlistedRipple = useRipple();
  const pendingRipple = useRipple();
  const interviewedRipple = useRipple();

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const [exp, viewer] = await Promise.all([
        can('candidates.export'),
        isViewer(),
      ]);
      
      setCanExport(exp);
      setIsViewerRole(viewer);
    };

    checkPermissions();
  }, [can, isViewer]);

  useEffect(() => {
    async function fetchCandidates() {
      // Wait for organization context to load
      if (orgLoading) {
        return;
      }

      // Check authentication
      try {
        const user = await authApi.getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }
      } catch (authError) {
        console.log('User not authenticated');
        router.push('/login');
        return;
      }

      // Check if organization is selected
      if (!currentOrganization) {
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
          console.error('Error fetching candidates:', candidatesError);
          throw candidatesError;
        }

        console.log('[CANDIDATES] Fetched', candidatesData?.length || 0, 'candidates');
        setCandidates(candidatesData || []);
      } catch (err) {
        console.error('Error fetching candidates:', err);
        setError('Failed to connect to database. Please check your Supabase configuration.');
      } finally {
        setLoading(false);
      }
    }

    fetchCandidates();
  }, [router, currentOrganization, orgLoading]);

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
    fetchCandidateApplications(candidate.id);
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
      case 'interviewed':
        return 'text-blue-400 bg-blue-500/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'hired':
        return 'text-green-400 bg-green-500/10';
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

  const filteredCandidates = filterStatus === 'all' 
    ? candidates 
    : candidates.filter(c => c.status === filterStatus);

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    pending: candidates.filter(c => c.status === 'pending').length,
    interviewed: candidates.filter(c => c.status === 'interviewed').length,
  };

  return (
    <DashboardLayout>
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
                    <span>Export</span>
                  </button>

                  <AnimatePresence>
                    {exportMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-1 z-[60]"
                        onMouseLeave={() => setExportMenuOpen(false)}
                      >
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

              <GlassButton
                size="default"
                className="glass-emerald"
                contentClassName="flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Upload Resume</span>
              </GlassButton>
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
                  onClick={(e) => pendingRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-yellow-500/20 hover:-translate-y-1 hover:border-yellow-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={pendingRipple.ripples} color="rgba(234, 179, 8, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-yellow-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-yellow-500/30 shadow-lg shadow-yellow-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-yellow-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats.pending} duration={1.5} delay={0.4} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Pending Review</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  onClick={(e) => interviewedRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 hover:border-blue-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={interviewedRipple.ripples} color="rgba(59, 130, 246, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-blue-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats.interviewed} duration={1.5} delay={0.5} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Interviewed</p>
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
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'pending'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setFilterStatus('interviewed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'interviewed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Interviewed ({stats.interviewed})
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === 'rejected'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Rejected
                </button>
              </div>

              {/* Candidates List */}
              {filteredCandidates.length === 0 ? (
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center shadow-lg shadow-black/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="relative z-10">
                    <svg className="w-16 h-16 text-gray-600 mx-auto mb-4 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-400 text-lg font-medium drop-shadow-md">No candidates found</p>
                    <p className="text-gray-500 text-sm mt-2">Upload resumes to get started</p>
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
                            
                            {/* Show applied jobs */}
                            {candidate.job_applications && candidate.job_applications.length > 0 ? (
                              <div className="mb-2">
                                <p className="text-emerald-400 text-sm font-medium mb-1 drop-shadow-md">
                                  Applied to {candidate.job_applications.length} {candidate.job_applications.length === 1 ? 'position' : 'positions'}:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {candidate.job_applications.slice(0, 3).map((app, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs border border-emerald-500/30 backdrop-blur-sm shadow-lg shadow-emerald-500/10"
                                    >
                                      {app.job_listings.title}
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

                        {/* Score */}
                        <div className="text-right ml-4">
                          <p className={`text-4xl font-bold mb-2 drop-shadow-lg ${getScoreColor(candidate.score || 0)}`}>
                            {candidate.score || 0}
                          </p>
                          <p className="text-gray-400 text-sm mb-3">Score</p>
                          <div className="w-32 h-2 bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden border border-gray-600/30 shadow-inner">
                            <div
                              className={`h-full ${getProgressBarColor(candidate.score || 0)} transition-all shadow-lg`}
                              style={{ width: `${candidate.score || 0}%` }}
                            ></div>
                          </div>
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

                {/* Overall Score */}
                <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-2xl p-6 border border-emerald-500/30">
                  <h3 className="text-lg font-bold text-white mb-4">Overall Score</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-6xl font-bold ${getScoreColor(selectedCandidate.score || 0)}`}>
                        {selectedCandidate.score || 0}
                      </p>
                      <p className="text-gray-400 mt-2">out of 100</p>
                    </div>
                    <div className="w-32 h-32">
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
                          strokeDasharray={`${(selectedCandidate.score || 0) * 3.39} 339`}
                          className={getScoreColor(selectedCandidate.score || 0).replace('text-', 'text-')}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Job Applications & AI Summaries */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Job Applications ({candidateApplications.length})
                  </h3>

                  {loadingApplications ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                  ) : candidateApplications.length === 0 ? (
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
                      <p className="text-gray-400">No job applications found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {candidateApplications.map((application) => (
                        <div
                          key={application.id}
                          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
                        >
                          {/* Job Title */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-white mb-1">
                                {application.job_listings.title}
                              </h4>
                              <p className="text-sm text-gray-400">
                                {application.job_listings.department} • {application.job_listings.employment_type}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-3xl font-bold ${getScoreColor(application.match_score || 0)}`}>
                                {application.match_score || 0}
                              </p>
                              <p className="text-xs text-gray-400">Match Score</p>
                            </div>
                          </div>

                          {/* AI Summary */}
                          {application.ai_analysis && (
                            <div className="space-y-4">
                              {/* Summary */}
                              {application.ai_analysis.summary && (
                                <div>
                                  <h5 className="text-sm font-semibold text-emerald-400 mb-2">AI Summary</h5>
                                  <p className="text-gray-300 text-sm leading-relaxed">
                                    {application.ai_analysis.summary}
                                  </p>
                                </div>
                              )}

                              {/* Strengths */}
                              {application.ai_analysis.strengths && application.ai_analysis.strengths.length > 0 && (
                                <div>
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
                                <div>
                                  <h5 className="text-sm font-semibold text-yellow-400 mb-2">Areas for Development</h5>
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
                                <div>
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

                          {/* Applied Date */}
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="text-xs text-gray-400">
                              Applied {new Date(application.applied_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
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
    </DashboardLayout>
  );
}
