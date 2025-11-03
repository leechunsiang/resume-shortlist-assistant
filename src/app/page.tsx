'use client';

import { useEffect, useState } from 'react';
import { candidatesApi, dashboardApi, organizationsApi, authApi, jobsApi, type Candidate, type DashboardStats, type JobListing } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useRouter } from 'next/navigation';
import { Briefcase, Users, Clock, TrendingUp, ArrowRight, MapPin, Calendar } from 'lucide-react';
import AnimatedList from '@/components/animated-list';
import TextType from '@/components/text-type';
import { useRipple, RippleEffect } from '@/components/ripple-effect';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { AnimatedCounter, AnimatedProgressBar, PulseStatusBadge } from '@/components/animated-counter';

export default function Home() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string>('');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [headerAnimationComplete, setHeaderAnimationComplete] = useState(false);
  
  // Ripple effects for each card
  const candidatesRipple = useRipple();
  const jobsRipple = useRipple();
  const shortlistedRipple = useRipple();
  const successRateRipple = useRipple();
  
  // Animated counters for stats
  const candidatesCount = useMotionValue(0);
  const jobsCount = useMotionValue(0);
  const shortlistedCount = useMotionValue(0);
  const successRate = useMotionValue(0);
  
  const [displayCandidates, setDisplayCandidates] = useState(0);
  const [displayJobs, setDisplayJobs] = useState(0);
  const [displayShortlisted, setDisplayShortlisted] = useState(0);
  const [displaySuccessRate, setDisplaySuccessRate] = useState(0);
  
  // Animate counters when stats change
  useEffect(() => {
    if (stats && !loading) {
      const candidatesAnim = animate(candidatesCount, stats.total_candidates || 0, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate: (v) => setDisplayCandidates(Math.round(v))
      });
      
      const jobsAnim = animate(jobsCount, stats.active_jobs || 0, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate: (v) => setDisplayJobs(Math.round(v))
      });
      
      const shortlistedAnim = animate(shortlistedCount, stats.shortlisted_count || 0, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate: (v) => setDisplayShortlisted(Math.round(v))
      });
      
      const successRateAnim = animate(successRate, stats.success_rate || 0, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate: (v) => setDisplaySuccessRate(Math.round(v))
      });
      
      setTimeout(() => setIsAnimationComplete(true), 1500);
      
      return () => {
        candidatesAnim.stop();
        jobsAnim.stop();
        shortlistedAnim.stop();
        successRateAnim.stop();
      };
    }
  }, [stats, loading]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user and their organization
        let user;
        try {
          user = await authApi.getCurrentUser();
        } catch (authError) {
          // Authentication failed - user not logged in
          console.log('User not authenticated');
          setLoading(false);
          setError('auth');
          return;
        }

        if (!user) {
          setLoading(false);
          setError('auth'); // Special error type for authentication
          return;
        }

        // Get user's first name from metadata
        const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
        setUserFirstName(firstName);

        const orgs = await organizationsApi.getUserOrganizations(user.id);
        if (!orgs || orgs.length === 0) {
          router.push('/organization/setup');
          return;
        }

        const orgId = orgs[0].id;
        setOrganizationId(orgId);
        
        // Fetch dashboard stats, recent candidates, and active jobs for this organization
        const [statsData, candidatesData, jobsData] = await Promise.all([
          dashboardApi.getStats(orgId),
          candidatesApi.getRecent(orgId, 5),
          jobsApi.getAll(orgId)
        ]);
        
        setStats(statsData);
        setCandidates(candidatesData);
        setJobs(jobsData.filter(job => job.status === 'active'));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('database');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'text-emerald-400';
      case 'rejected':
        return 'text-red-400';
      case 'interviewed':
        return 'text-blue-400';
      case 'hired':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <DashboardLayout>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-transparent px-4 md:px-8 py-4 md:py-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 min-h-[2.5rem]">
              {userFirstName ? (
                <TextType 
                  text={`Welcome back, ${userFirstName}!`}
                  speed={50}
                  cursor={true}
                  cursorChar="|"
                  onComplete={() => setHeaderAnimationComplete(true)}
                />
              ) : error === 'auth' ? (
                <TextType 
                  text="Welcome to Resume Shortlist Assistant!"
                  speed={50}
                  cursor={true}
                  cursorChar="|"
                  onComplete={() => setHeaderAnimationComplete(true)}
                />
              ) : null}
            </h1>
            <p className="text-sm md:text-base text-gray-400 min-h-[1.5rem]">
              {error === 'auth' ? (
                headerAnimationComplete ? (
                  <TextType 
                    text="Automate Resume Shortlisting with Clarity and Control."
                    speed={40}
                    cursor={true}
                    cursorChar="|"
                  />
                ) : null
              ) : userFirstName && headerAnimationComplete ? (
                <TextType 
                  text="Overview of your recruitment pipeline"
                  speed={40}
                  cursor={true}
                  cursorChar="|"
                />
              ) : null}
            </p>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {error === 'auth' ? (
            <div className="mb-6 bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/50 rounded-lg p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-emerald-400 mb-2">Log in to get started</p>
              <p className="text-gray-400 text-sm mb-6">Please log in to access your recruitment dashboard</p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
              >
                Go to Login
              </button>
            </div>
          ) : error === 'database' ? (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              <p className="font-semibold mb-1">Connection Error</p>
              <p className="text-sm">Failed to connect to database. Please check your Supabase configuration.</p>
              <p className="text-xs mt-2">Please configure your Supabase credentials in .env.local</p>
            </div>
          ) : null}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="text-gray-400 mt-4">Loading data...</p>
            </div>
          ) : error !== 'auth' ? (
            <>
              {/* Bento Box Grid Layout - Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-fr gap-4 md:gap-6 lg:h-[calc(100vh-14rem)]">
                
                {/* Top Left - Total Candidates (Small) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onClick={(e) => {
                    candidatesRipple.addRipple(e);
                    router.push('/candidates');
                  }}
                  className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out min-h-[140px] flex flex-col justify-center shadow-lg shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/30 hover:border-emerald-400/60 cursor-pointer"
                >
                  <RippleEffect ripples={candidatesRipple.ripples} color="rgba(16, 185, 129, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-400/20 transition-all duration-300"></div>
                  <Users className="w-8 h-8 lg:w-10 lg:h-10 text-emerald-300 mb-4 relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-4xl lg:text-5xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats?.total_candidates || 0} duration={1.5} delay={0.2} />
                  </h3>
                  <p className="text-emerald-200 text-sm lg:text-base font-medium relative z-10">Total Candidates</p>
                </motion.div>

                {/* Top Center-Left - Active Jobs Count (Small) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  onClick={(e) => {
                    jobsRipple.addRipple(e);
                    router.push('/job-listings');
                  }}
                  className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out min-h-[140px] flex flex-col justify-center shadow-lg shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400/60 cursor-pointer"
                >
                  <RippleEffect ripples={jobsRipple.ripples} color="rgba(59, 130, 246, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-400/20 transition-all duration-300"></div>
                  <Briefcase className="w-8 h-8 lg:w-10 lg:h-10 text-blue-300 mb-4 relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-4xl lg:text-5xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats?.active_jobs || 0} duration={1.5} delay={0.3} />
                  </h3>
                  <p className="text-blue-200 text-sm lg:text-base font-medium relative z-10">Active Jobs</p>
                </motion.div>

                {/* Top Right - Recent Candidates (Large, spans 2 columns on desktop) */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 flex flex-col min-h-[400px] lg:min-h-0 lg:h-full shadow-2xl shadow-black/20 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
                  <div className="flex items-center justify-between mb-6 flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                        <Users className="w-5 h-5 text-emerald-400 drop-shadow-lg" />
                      </div>
                      <h2 className="text-xl font-bold text-white drop-shadow-md">Recent Candidates</h2>
                    </div>
                    <button
                      onClick={() => router.push('/candidates')}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 transition-colors drop-shadow-md"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {candidates.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center bg-black/20 backdrop-blur-sm rounded-2xl border border-gray-700/30 relative z-10">
                      <div>
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No candidates found</p>
                        <p className="text-gray-500 text-sm mt-1">Create a job and add candidates to get started</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatedList
                      items={candidates}
                      renderItem={(candidate, index) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="bg-gray-800/30 backdrop-blur-md border border-gray-700/40 rounded-2xl p-4 hover:bg-gray-700/40 hover:border-emerald-500/50 hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300 ease-out cursor-pointer group mb-4 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-emerald-500/20 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-emerald-500/20 border border-emerald-400/30 group-hover:scale-110 transition-transform duration-300">
                                {getInitials(candidate.first_name, candidate.last_name)}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold group-hover:text-emerald-400 transition-colors drop-shadow-sm">
                                  {candidate.first_name} {candidate.last_name}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {candidate.current_position || 'No position specified'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-semibold drop-shadow-sm">{candidate.score || 0}</span>
                                <div className="w-20 h-2 bg-gray-700/50 backdrop-blur-sm rounded-full overflow-hidden border border-gray-600/30">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${candidate.score || 0}%` }}
                                    transition={{ duration: 1.5, delay: index * 0.1 + 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-sm shadow-emerald-500/50"
                                  />
                                </div>
                              </div>
                              {(candidate.status === 'shortlisted' || candidate.status === 'pending') ? (
                                <PulseStatusBadge
                                  className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm border ${
                                    candidate.status === 'shortlisted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                  }`}
                                  pulseColor={candidate.status === 'shortlisted' ? 'emerald' : 'gray'}
                                >
                                  {getStatusLabel(candidate.status)}
                                </PulseStatusBadge>
                              ) : (
                                <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm border ${
                                  candidate.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  candidate.status === 'interviewed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                  candidate.status === 'hired' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}>
                                  {getStatusLabel(candidate.status)}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                      onItemSelect={() => router.push('/candidates')}
                      showGradients={true}
                      enableArrowNavigation={false}
                      displayScrollbar={true}
                    />
                  )}
                </motion.div>

                {/* Middle Left - Active Job Listings (Large, spans 2 columns on desktop) */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 flex flex-col min-h-[400px] lg:min-h-0 lg:h-full shadow-2xl shadow-black/20 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
                  <div className="flex items-center justify-between mb-6 flex-shrink-0 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10">
                        <Briefcase className="w-5 h-5 text-blue-400 drop-shadow-lg" />
                      </div>
                      <h2 className="text-xl font-bold text-white drop-shadow-md">Active Jobs</h2>
                    </div>
                    <button
                      onClick={() => router.push('/job-listings')}
                      className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 transition-colors drop-shadow-md"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {jobs.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center bg-black/20 backdrop-blur-sm rounded-2xl border border-gray-700/30 relative z-10">
                      <div>
                        <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No active jobs</p>
                        <p className="text-gray-500 text-sm mt-1">Create a job to start recruiting</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatedList
                      items={jobs}
                      renderItem={(job, index) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="bg-gray-800/30 backdrop-blur-md border border-gray-700/40 rounded-2xl p-4 hover:bg-gray-700/40 hover:border-blue-500/50 hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300 ease-out cursor-pointer group mb-4 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-blue-500/20 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="flex items-start justify-between mb-2 relative z-10">
                            <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors drop-shadow-sm">
                              {job.title}
                            </h3>
                            <span className="px-2 py-1 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                              Active
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 relative z-10">
                            {job.department && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                {job.department}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {job.location}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                      onItemSelect={() => router.push('/job-listings')}
                      showGradients={true}
                      enableArrowNavigation={false}
                      displayScrollbar={true}
                    />
                  )}
                </motion.div>

                {/* Bottom Right - Shortlisted (Small) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  onClick={(e) => {
                    shortlistedRipple.addRipple(e);
                  }}
                  className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out min-h-[140px] flex flex-col justify-center shadow-lg shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400/60 cursor-pointer"
                >
                  <RippleEffect ripples={shortlistedRipple.ripples} color="rgba(168, 85, 247, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-purple-400/20 transition-all duration-300"></div>
                  <Clock className="w-8 h-8 lg:w-10 lg:h-10 text-purple-300 mb-4 relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-4xl lg:text-5xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats?.shortlisted_count || 0} duration={1.5} delay={0.6} />
                  </h3>
                  <p className="text-purple-200 text-sm lg:text-base font-medium relative z-10">Shortlisted</p>
                </motion.div>

                {/* Bottom Right - Success Rate (Small) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  onClick={(e) => {
                    successRateRipple.addRipple(e);
                  }}
                  className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out min-h-[140px] flex flex-col justify-center shadow-lg shadow-orange-500/10 hover:shadow-2xl hover:shadow-orange-500/30 hover:border-orange-400/60 cursor-pointer"
                >
                  <RippleEffect ripples={successRateRipple.ripples} color="rgba(249, 115, 22, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 via-transparent to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-400/20 transition-all duration-300"></div>
                  <TrendingUp className="w-8 h-8 lg:w-10 lg:h-10 text-orange-300 mb-4 relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-4xl lg:text-5xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={stats?.success_rate || 0} duration={1.5} delay={0.7} suffix="%" />
                  </h3>
                  <p className="text-orange-200 text-sm lg:text-base font-medium relative z-10">Success Rate</p>
                </motion.div>

              </div>
            </>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
