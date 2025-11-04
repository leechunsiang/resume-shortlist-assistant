'use client';

import { useEffect, useState } from 'react';
import { jobsApi, candidatesApi, organizationsApi, authApi, type JobListing } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, Edit, Users, Trash2, Download, FileText, Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TextType from '@/components/text-type';
import { useRipple, RippleEffect } from '@/components/ripple-effect';
import { AnimatedCounter, PulseStatusBadge } from '@/components/animated-counter';
import { GlassButton } from '@/components/ui/glass-button';
import { Progress } from '@/components/ui/progress-1';
import { exportJobsToCSV, exportJobsToPDF } from '@/lib/export';
import { FormattedDescription } from '@/components/formatted-description';
import { usePermissions, useRole } from '@/lib/rbac';
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';

export default function JobListings() {
  const router = useRouter();
  const { can } = usePermissions();
  const { isViewer } = useRole();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisPercentage, setAnalysisPercentage] = useState(0);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
    status: 'draft' as 'active' | 'draft' | 'inactive'
  });
  
  // RBAC permissions
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [canUseAI, setCanUseAI] = useState(false);
  const [isViewerRole, setIsViewerRole] = useState(false);
  
  // Ripple effects for stat cards
  const totalOpeningsRipple = useRipple();
  const activeJobsRipple = useRipple();
  const totalApplicantsRipple = useRipple();
  const draftJobsRipple = useRipple();

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const [create, update, del, exp, ai, viewer] = await Promise.all([
        can('jobs.create'),
        can('jobs.update'),
        can('jobs.delete'),
        can('jobs.export'),
        can('ai.shortlist'),
        isViewer(),
      ]);
      
      setCanCreate(create);
      setCanUpdate(update);
      setCanDelete(del);
      setCanExport(exp);
      setCanUseAI(ai);
      setIsViewerRole(viewer);
    };

    checkPermissions();
  }, [can, isViewer]);

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
          console.log('User not authenticated');
          router.push('/login');
          return;
        }

        if (!user) {
          router.push('/login');
          return;
        }

        const orgs = await organizationsApi.getUserOrganizations(user.id);
        if (!orgs || orgs.length === 0) {
          router.push('/organization/setup');
          return;
        }

        const orgId = orgs[0].id;
        setOrganizationId(orgId);
        setUserId(user.id);
        
        // Fetch all jobs and total candidates count for this organization
        const [jobsData, candidatesData] = await Promise.all([
          jobsApi.getAll(orgId),
          candidatesApi.getAll(orgId)
        ]);
        
        setJobs(jobsData);
        setTotalCandidates(candidatesData.length);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to connect to database. Please check your Supabase configuration.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const activeJobs = jobs.filter(job => job.status === 'active');
  const draftJobs = jobs.filter(job => job.status === 'draft');
  const totalJobs = jobs.length;

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit if on step 4
    if (currentStep !== 4) {
      console.log('Prevented submission - not on step 4, current step:', currentStep);
      return;
    }
    
    if (!organizationId || !userId) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && editingJobId) {
        // Update existing job
        const updatedJob = await jobsApi.update(editingJobId, {
          title: formData.title,
          department: formData.department || undefined,
          location: formData.location || undefined,
          description: formData.description || undefined,
          requirements: formData.requirements || undefined,
          status: formData.status,
        });

        // Update job in the list
        setJobs(jobs.map(job => job.id === editingJobId ? updatedJob : job));
      } else {
        // Create new job
        const newJob = await jobsApi.create({
          organization_id: organizationId,
          title: formData.title,
          department: formData.department || undefined,
          location: formData.location || undefined,
          description: formData.description || undefined,
          requirements: formData.requirements || undefined,
          status: formData.status,
          created_by: userId
        });

        // Add new job to the list
        setJobs([newJob, ...jobs]);
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
        department: '',
        location: '',
        description: '',
        requirements: '',
        status: 'draft'
      });
      setCurrentStep(1); // Reset to first step
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingJobId(null);
    } catch (err) {
      console.error('Error saving job:', err);
      setError(isEditMode ? 'Failed to update job. Please try again.' : 'Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditJob = (job: JobListing, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setFormData({
      title: job.title,
      department: job.department || '',
      location: job.location || '',
      description: job.description || '',
      requirements: job.requirements || '',
      status: job.status
    });
    setIsEditMode(true);
    setEditingJobId(job.id);
    setCurrentStep(1); // Reset to first step
    setIsModalOpen(true);
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setJobToDelete(jobId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    setError(null);
    try {
      console.log('Deleting job:', jobToDelete);
      await jobsApi.delete(jobToDelete);
      setJobs(jobs.filter(job => job.id !== jobToDelete));
      console.log('Job deleted successfully');
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (err: any) {
      console.error('Error deleting job:', err);
      const errorMessage = err?.message || 'Failed to delete job. Please try again.';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setJobToDelete(null);
  };

  const handleAIShortlist = async (job: JobListing) => {
    // Open upload modal instead of directly analyzing
    setSelectedJob(job);
    setIsUploadModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'text/plain' ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.txt')
      );
      setUploadedFiles(prev => [...prev, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processResumes = async () => {
    if (!selectedJob || uploadedFiles.length === 0 || !organizationId) return;
    
    setIsAnalyzing(true);
    setIsUploadModalOpen(false);
    setAnalysisProgress('Initializing analysis...');
    setAnalysisPercentage(0);
    
    try {
      const resumeTexts: { fileName: string; text: string; type: string }[] = [];
      const totalSteps = uploadedFiles.length + 2; // files + AI analysis + completion
      let currentStep = 0;
      
      // Extract text from each file
      setAnalysisProgress('Extracting text from resumes...');
      setAnalysisPercentage(10);
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setAnalysisProgress(`Processing ${file.name}...`);
        
        const text = await extractTextFromFile(file);
        const type = file.name.endsWith('.pdf') ? 'pdf' : 'txt';
        resumeTexts.push({ fileName: file.name, text, type });
        
        currentStep++;
        const progress = 10 + (currentStep / totalSteps) * 50; // 10-60% for file processing
        setAnalysisPercentage(Math.round(progress));
      }
      
      setAnalysisProgress('Analyzing candidates with AI...');
      setAnalysisPercentage(65);
      
      // Send to API for AI analysis
      const response = await fetch('/api/ai-shortlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          organizationId: organizationId,
          resumes: resumeTexts,
          mode: 'upload',
        }),
      });

      setAnalysisPercentage(85);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze candidates');
      }

      setAnalysisPercentage(100);
      setAnalysisProgress(`✓ Analysis complete! Processed ${data.results.length} candidates`);
      
      // Clear uploaded files
      setUploadedFiles([]);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress('');
        setAnalysisPercentage(0);
      }, 3000);

    } catch (err: any) {
      console.error('Error processing resumes:', err);
      setError(err.message || 'Failed to process resumes');
      setIsAnalyzing(false);
      setAnalysisProgress('');
      setAnalysisPercentage(0);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result;
        
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          resolve(content as string);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          // For PDFs, read as data URL (base64) and send to backend for parsing
          resolve(content as string);
        } else {
          resolve(content as string);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDFs, read as data URL so we can send base64 to backend
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold">
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="px-3 py-1 bg-gray-700/50 text-gray-400 rounded-full text-xs font-semibold">
            Draft
          </span>
        );
      case 'inactive':
        return (
          <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: 'active' | 'inactive' | 'draft') => {
    if (!organizationId) return;
    
    try {
      await jobsApi.update(jobId, { status: newStatus });
      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
      // Update selected job if it's the one being changed
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update job status');
    }
  };

  return (
    <DashboardLayout>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-transparent px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                <TextType 
                  text="Job Listings"
                  speed={50}
                  cursor={true}
                  cursorChar="|"
                />
              </h1>
              <p className="text-gray-400">Manage and create job postings</p>
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
                    disabled={jobs.length === 0}
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
                            exportJobsToCSV(jobs);
                            setExportMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm text-white transition-colors"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => {
                            exportJobsToPDF(jobs);
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

              {canCreate && (
                <GlassButton
                  onClick={() => {
                    setCurrentStep(1); // Reset to first step when opening
                    setIsModalOpen(true);
                  }}
                  size="default"
                  className="glass-emerald"
                  contentClassName="flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create New Job</span>
                </GlassButton>
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

        {/* Stats Cards */}
        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
              <p className="font-semibold mb-1">Connection Error</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2">Please configure your Supabase credentials in .env.local</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              <p className="text-gray-400 mt-4">Loading jobs...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  onClick={(e) => totalOpeningsRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 hover:border-emerald-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={totalOpeningsRipple.ripples} color="rgba(16, 185, 129, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-emerald-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={totalJobs} duration={1.5} delay={0.2} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Total Openings</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  onClick={(e) => activeJobsRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 hover:border-blue-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={activeJobsRipple.ripples} color="rgba(59, 130, 246, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-blue-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={activeJobs.length} duration={1.5} delay={0.3} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Active Jobs</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  onClick={(e) => totalApplicantsRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 hover:border-purple-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={totalApplicantsRipple.ripples} color="rgba(168, 85, 247, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-purple-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={totalCandidates} duration={1.5} delay={0.4} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Total Applicants</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  onClick={(e) => draftJobsRipple.addRipple(e)}
                  className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-lg shadow-black/10 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 hover:border-orange-500/50 transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer"
                >
                  <RippleEffect ripples={draftJobsRipple.ripples} color="rgba(249, 115, 22, 0.4)" />
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-orange-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-orange-500/30 shadow-lg shadow-orange-500/10 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-orange-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 relative z-10 drop-shadow-md">
                    <AnimatedCounter value={draftJobs.length} duration={1.5} delay={0.5} />
                  </h3>
                  <p className="text-gray-400 text-sm relative z-10">Draft Jobs</p>
                </motion.div>
              </div>

              {/* Job Listings Grid */}
              {jobs.length === 0 ? (
                <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center shadow-lg shadow-black/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 text-lg font-medium relative z-10">No job listings found</p>
                  {canCreate ? (
                    <>
                      <p className="text-gray-500 text-sm mt-2 relative z-10">Create your first job listing to get started</p>
                      <div className="mt-6 inline-block relative z-10">
                        <GlassButton
                          onClick={() => {
                            setCurrentStep(1); // Reset to first step when opening
                            setIsModalOpen(true);
                          }}
                          size="default"
                          className="glass-emerald shadow-lg shadow-emerald-500/20"
                        >
                          Create New Job
                        </GlassButton>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2 relative z-10">
                      No jobs have been created yet. Contact an admin to create job listings.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <motion.div 
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      onClick={() => setSelectedJob(job)}
                      className={`bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden group shadow-lg shadow-black/10 ${
                        job.status === 'draft' ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/10 via-transparent to-gray-900/20 pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            {job.department && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {job.department}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                      
                      {job.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                      
                      {job.requirements && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.requirements.split(',').slice(0, 4).map((req, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs">
                              {req.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="text-sm">
                          <span className="text-gray-400">Status: </span>
                          <span className="text-white capitalize">{job.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {canUpdate && (
                            <button
                              onClick={(e) => handleEditJob(job, e)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit job"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={(e) => handleDeleteJob(job.id, e)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete job"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
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

      {/* Create/Edit Job Modal with Stepper */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={() => {
                setIsModalOpen(false);
                setIsEditMode(false);
                setEditingJobId(null);
                setCurrentStep(1);
                setFormData({
                  title: '',
                  department: '',
                  location: '',
                  description: '',
                  requirements: '',
                  status: 'draft'
                });
              }}
            />
            
            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-[61] p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
            {/* Left Side - Stepper Navigation */}
            <div className="w-64 bg-gray-900/50 border-r border-gray-700 p-6 flex flex-col">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit Job' : 'Create New Job'}</h2>
                <p className="text-sm text-gray-400 mt-1">Fill in the job details</p>
              </div>
              
              <Stepper
                value={currentStep}
                onValueChange={setCurrentStep}
                orientation="vertical"
                className="flex-1"
                indicators={{
                  completed: <Check className="size-4" />,
                }}
              >
                <StepperNav>
                  <StepperItem step={1} className="relative items-start">
                    <StepperTrigger className="items-start pb-8 gap-2.5 w-full">
                      <StepperIndicator className="data-[state=completed]:bg-emerald-500 data-[state=completed]:text-white data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=inactive]:bg-gray-700 data-[state=inactive]:text-gray-400">
                        1
                      </StepperIndicator>
                      <div className="mt-0.5 text-left">
                        <StepperTitle className="text-white">Job Title</StepperTitle>
                        <p className="text-xs text-gray-400 mt-1">Basic job information</p>
                      </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 h-[calc(100%-2rem)] group-data-[state=completed]/step:bg-emerald-500" />
                  </StepperItem>

                  <StepperItem step={2} className="relative items-start">
                    <StepperTrigger className="items-start pb-8 gap-2.5 w-full">
                      <StepperIndicator className="data-[state=completed]:bg-emerald-500 data-[state=completed]:text-white data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=inactive]:bg-gray-700 data-[state=inactive]:text-gray-400">
                        2
                      </StepperIndicator>
                      <div className="mt-0.5 text-left">
                        <StepperTitle className="text-white">Department & Location</StepperTitle>
                        <p className="text-xs text-gray-400 mt-1">Where this role belongs</p>
                      </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 h-[calc(100%-2rem)] group-data-[state=completed]/step:bg-emerald-500" />
                  </StepperItem>

                  <StepperItem step={3} className="relative items-start">
                    <StepperTrigger className="items-start pb-8 gap-2.5 w-full">
                      <StepperIndicator className="data-[state=completed]:bg-emerald-500 data-[state=completed]:text-white data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=inactive]:bg-gray-700 data-[state=inactive]:text-gray-400">
                        3
                      </StepperIndicator>
                      <div className="mt-0.5 text-left">
                        <StepperTitle className="text-white">Requirements</StepperTitle>
                        <p className="text-xs text-gray-400 mt-1">Skills and qualifications</p>
                      </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 h-[calc(100%-2rem)] group-data-[state=completed]/step:bg-emerald-500" />
                  </StepperItem>

                  <StepperItem step={4} className="relative items-start">
                    <StepperTrigger className="items-start pb-0 gap-2.5 w-full">
                      <StepperIndicator className="data-[state=completed]:bg-emerald-500 data-[state=completed]:text-white data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=inactive]:bg-gray-700 data-[state=inactive]:text-gray-400">
                        4
                      </StepperIndicator>
                      <div className="mt-0.5 text-left">
                        <StepperTitle className="text-white">Job Description</StepperTitle>
                        <p className="text-xs text-gray-400 mt-1">Detailed role description</p>
                      </div>
                    </StepperTrigger>
                  </StepperItem>
                </StepperNav>
              </Stepper>
            </div>

            {/* Right Side - Form Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Step {currentStep} of 4</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {currentStep === 1 && "Enter the job title"}
                    {currentStep === 2 && "Specify department and location"}
                    {currentStep === 3 && "List the requirements"}
                    {currentStep === 4 && "Add the job description"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setEditingJobId(null);
                    setCurrentStep(1);
                    setFormData({
                      title: '',
                      department: '',
                      location: '',
                      description: '',
                      requirements: '',
                      status: 'draft'
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form 
                onSubmit={handleCreateJob} 
                onKeyDown={(e) => {
                  // Prevent Enter key from submitting form except when on step 4
                  if (e.key === 'Enter' && currentStep < 4 && e.target instanceof HTMLInputElement) {
                    e.preventDefault();
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="space-y-6"
              >
                <Stepper value={currentStep} onValueChange={setCurrentStep}>
                  {/* Step 1: Job Title */}
                  <StepperContent value={1}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                          Job Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., Senior Full Stack Developer"
                        />
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </StepperContent>

                  {/* Step 2: Department & Location */}
                  <StepperContent value={2}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., Engineering"
                        />
                      </div>

                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., Remote, San Francisco, CA"
                        />
                      </div>
                    </div>
                  </StepperContent>

                  {/* Step 3: Requirements */}
                  <StepperContent value={3}>
                    <div>
                      <label htmlFor="requirements" className="block text-sm font-medium text-gray-300 mb-2">
                        Requirements (comma-separated)
                      </label>
                      <textarea
                        id="requirements"
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        rows={8}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="e.g., React, Node.js, TypeScript, 5+ years experience"
                      />
                      <p className="text-xs text-gray-400 mt-2">Separate each requirement with a comma</p>
                    </div>
                  </StepperContent>

                  {/* Step 4: Job Description */}
                  <StepperContent value={4}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                          Job Description
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const textarea = document.getElementById('description') as HTMLTextAreaElement;
                              const cursorPos = textarea.selectionStart;
                              const textBefore = formData.description.substring(0, cursorPos);
                              const textAfter = formData.description.substring(cursorPos);
                              const newText = textBefore + '\n• ' + textAfter;
                              setFormData({ ...formData, description: newText });
                              setTimeout(() => {
                                textarea.focus();
                                textarea.selectionStart = textarea.selectionEnd = cursorPos + 3;
                              }, 0);
                            }}
                            className="px-3 py-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-md border border-emerald-500/30 transition-colors"
                          >
                            + Bullet Point
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const textarea = document.getElementById('description') as HTMLTextAreaElement;
                              const cursorPos = textarea.selectionStart;
                              const textBefore = formData.description.substring(0, cursorPos);
                              const textAfter = formData.description.substring(cursorPos);
                              const newText = textBefore + '\n\nSection Title:\n\n' + textAfter;
                              setFormData({ ...formData, description: newText });
                              setTimeout(() => {
                                textarea.focus();
                                const titleStart = cursorPos + 2;
                                textarea.selectionStart = titleStart;
                                textarea.selectionEnd = titleStart + 13; // Select "Section Title"
                              }, 0);
                            }}
                            className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md border border-blue-500/30 transition-colors"
                          >
                            + Section
                          </button>
                        </div>
                      </div>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          // Auto-add bullet point on Enter if current line starts with a bullet
                          if (e.key === 'Enter') {
                            const textarea = e.currentTarget;
                            const cursorPos = textarea.selectionStart;
                            const textBefore = formData.description.substring(0, cursorPos);
                            const currentLineStart = textBefore.lastIndexOf('\n') + 1;
                            const currentLine = textBefore.substring(currentLineStart);
                            
                            // Check if current line starts with a bullet point
                            if (currentLine.match(/^[•\-\*]\s/)) {
                              e.preventDefault();
                              const textAfter = formData.description.substring(cursorPos);
                              const bulletChar = currentLine.charAt(0);
                              const newText = textBefore + '\n' + bulletChar + ' ' + textAfter;
                              setFormData({ ...formData, description: newText });
                              setTimeout(() => {
                                textarea.selectionStart = textarea.selectionEnd = cursorPos + 3;
                              }, 0);
                            }
                          }
                        }}
                        rows={12}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="Click '+ Bullet Point' or '+ Section' to get started, or type freely..."
                      />
                      <div className="flex items-start gap-2 mt-2">
                        <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs text-gray-400">
                          Press Enter after a bullet point to automatically add another. Use the buttons above to add sections and bullet points.
                        </p>
                      </div>
                    </div>
                  </StepperContent>
                </Stepper>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (currentStep > 1) {
                        setCurrentStep(currentStep - 1);
                      } else {
                        setIsModalOpen(false);
                        setCurrentStep(1);
                      }
                    }}
                    className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                  </button>
                  
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentStep(currentStep + 1);
                      }}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>{isEditMode ? 'Update Job' : 'Create Job'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Job Details Slide-in Panel */}
      <AnimatePresence>
        {selectedJob && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-gradient-to-br from-gray-900 to-gray-800 border-l border-gray-700 z-50 overflow-y-auto"
            >
              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Action Buttons - Icon Buttons */}
                <div className="flex items-center justify-center gap-6">
                  {/* AI Shortlist Button */}
                  {canUseAI && (
                    <div className="group relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAIShortlist(selectedJob);
                        }}
                        disabled={isAnalyzing}
                        className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:scale-110"
                      >
                        <Sparkles className="w-6 h-6" />
                      </button>
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-purple-500/30 shadow-lg">
                        AI Shortlist Candidates
                      </div>
                    </div>
                  )}
                  
                  {/* Edit Job Button */}
                  {canUpdate && (
                    <div className="group relative">
                      <button 
                        onClick={(e) => handleEditJob(selectedJob, e)}
                        className="w-14 h-14 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition-all shadow-lg shadow-emerald-500/20 hover:scale-110"
                      >
                        <Edit className="w-6 h-6" />
                      </button>
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-emerald-500/30 shadow-lg">
                        Edit Job
                      </div>
                    </div>
                  )}
                  
                  {/* View Applicants Button */}
                  <div className="group relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push('/candidates');
                      }}
                      className="w-14 h-14 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-full font-medium transition-all border border-gray-700 hover:scale-110"
                    >
                      <Users className="w-6 h-6" />
                    </button>
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700 shadow-lg">
                      View Applicants
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  {canDelete && (
                    <div className="group relative">
                      <button 
                        onClick={(e) => handleDeleteJob(selectedJob.id, e)}
                        className="w-14 h-14 flex items-center justify-center bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded-full font-medium transition-all border border-red-900/50 hover:scale-110"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-red-900/30 shadow-lg">
                        Delete Job Listing
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="group relative">
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="w-14 h-14 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full font-medium transition-all border border-gray-700 hover:scale-110"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700 shadow-lg">
                      Close
                    </div>
                  </div>
                </div>

                {/* Title and Status */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <h1 className="text-3xl font-bold text-white">{selectedJob.title}</h1>
                    {getStatusBadge(selectedJob.status)}
                  </div>
                  
                  {/* Status Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Change Status
                    </label>
                    <select
                      value={selectedJob.status}
                      onChange={(e) => handleStatusChange(selectedJob.id, e.target.value as 'active' | 'inactive' | 'draft')}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {selectedJob.department && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{selectedJob.department}</span>
                      </div>
                    )}
                    {selectedJob.location && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{selectedJob.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Posted {new Date(selectedJob.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedJob.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Job Description
                    </h3>
                    <FormattedDescription description={selectedJob.description} />
                  </div>
                )}

                {/* Requirements */}
                {selectedJob.requirements && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Requirements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requirements.split(',').map((req, index) => (
                        <span 
                          key={index} 
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700"
                        >
                          {req.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Analysis Progress Modal */}
      <AnimatePresence>
        {isAnalyzing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-ping opacity-20"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">AI Analysis in Progress</h3>
                <p className="text-gray-400 text-sm">Analyzing candidates with AI...</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 font-medium">Workspace Setup</span>
                  <span className="text-gray-400">{Math.round(analysisPercentage)}%</span>
                </div>
                <Progress 
                  value={analysisPercentage} 
                  className="w-full h-2 bg-gray-700/50"
                  indicatorClassName="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600"
                />
                <div className="text-xs text-gray-400 min-h-[1rem]">
                  {analysisProgress}
                </div>
              </div>
            </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Upload Resumes Modal */}
      <AnimatePresence>
        {isUploadModalOpen && selectedJob && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Upload Candidate Resumes</h2>
                <p className="text-gray-400 text-sm">For: {selectedJob.title}</p>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadedFiles([]);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Upload Resumes (TXT format recommended)
              </label>
              
              {/* Warning about PDF */}
              <div className="mb-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-orange-300 text-xs font-medium mb-1">PDF Support Limited</p>
                    <p className="text-orange-400/80 text-xs">
                      For best results, convert resumes to TXT format before uploading. PDF text extraction may not work properly.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center hover:border-emerald-500/50 transition-colors">
                <input
                  type="file"
                  id="resume-upload"
                  accept=".txt,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-gray-400 text-sm">TXT or PDF files (max 10MB each)</p>
                  <p className="text-gray-500 text-xs mt-1">TXT format strongly recommended</p>
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Uploaded Files ({uploadedFiles.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{file.name}</p>
                          <p className="text-gray-400 text-xs">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors ml-2 flex-shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Info */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-purple-300 font-medium text-sm mb-1">AI-Powered Analysis</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Our AI will extract candidate information, analyze their qualifications against the job requirements, 
                    and provide match scores. Candidates will be automatically created in your database.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadedFiles([]);
                }}
                className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={processResumes}
                disabled={uploadedFiles.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Analyze {uploadedFiles.length} Resume{uploadedFiles.length !== 1 ? 's' : ''}</span>
              </button>
            </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/50 rounded-2xl p-8 max-w-md w-full"
              >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">Delete Job Listing</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm leading-relaxed">
                Are you sure you want to delete this job listing? This will permanently remove the job and all associated applications from the system.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteJob}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Job
              </button>
            </div>
          </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
