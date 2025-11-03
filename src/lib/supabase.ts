import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  user_email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  resume_text?: string;
  linkedin_url?: string;
  current_position?: string;
  years_of_experience?: number;
  skills?: string[];
  education?: any;
  work_experience?: any;
  status: 'pending' | 'shortlisted' | 'rejected' | 'interviewed' | 'hired';
  score?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JobListing {
  id: string;
  organization_id: string;
  title: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description?: string;
  requirements?: string;
  status: 'active' | 'inactive' | 'draft';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  status: 'pending' | 'shortlisted' | 'rejected' | 'interviewed' | 'hired';
  match_score?: number;
  ai_analysis?: any;
  applied_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_candidates: number;
  shortlisted_count: number;
  pending_review: number;
  success_rate: number;
  active_jobs: number;
}

// Helper functions for common database operations

// Organizations API
export const organizationsApi = {
  // Create new organization
  create: async (data: {
    name: string;
    description?: string;
    website?: string;
    industry?: string;
    size?: string;
    created_by: string;
  }) => {
    const { data: org, error } = await supabase
      .from('organizations')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    
    // Also add creator as owner
    await supabase
      .from('organization_members')
      .insert([{
        organization_id: org.id,
        user_id: data.created_by,
        user_email: (await authApi.getCurrentUser())?.email || '',
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      }]);
    
    return org as Organization;
  },

  // Get organization by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Organization;
  },

  // Get user's organizations
  getUserOrganizations: async (userId: string) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data.map(m => m.organizations) as Organization[];
  },

  // Update organization
  update: async (id: string, updates: Partial<Organization>) => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Organization;
  },

  // Delete organization
  delete: async (id: string) => {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Organization Members API
export const organizationMembersApi = {
  // Get all members of an organization
  getMembers: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false });
    
    if (error) throw error;
    return data as OrganizationMember[];
  },

  // Invite user to organization
  invite: async (data: {
    organization_id: string;
    user_email: string;
    role: 'admin' | 'member' | 'viewer';
    invited_by: string;
  }) => {
    const { data: member, error } = await supabase
      .from('organization_members')
      .insert([{
        ...data,
        user_id: '', // Will be filled when user accepts
        status: 'pending',
      }])
      .select()
      .single();
    
    if (error) throw error;
    return member as OrganizationMember;
  },

  // Update member role
  updateRole: async (id: string, role: 'owner' | 'admin' | 'member' | 'viewer') => {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as OrganizationMember;
  },

  // Remove member from organization
  remove: async (id: string) => {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Check if user is member of organization
  isMember: async (organizationId: string, userId: string) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error) return null;
    return data as OrganizationMember;
  },
};

export const candidatesApi = {
  // Get all candidates for an organization
  getAll: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Candidate[];
  },

  // Get recent candidates for an organization
  getRecent: async (organizationId: string, limit: number = 10) => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data as Candidate[];
  },

  // Get candidate by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Candidate;
  },

  // Create new candidate
  create: async (candidate: Partial<Candidate>) => {
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidate)
      .select()
      .single();
    
    if (error) throw error;
    return data as Candidate;
  },

  // Update candidate
  update: async (id: string, updates: Partial<Candidate>) => {
    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Candidate;
  },

  // Delete candidate
  delete: async (id: string) => {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get candidates by status
  getByStatus: async (status: Candidate['status']) => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('status', status)
      .order('score', { ascending: false });
    
    if (error) throw error;
    return data as Candidate[];
  }
};

export const jobsApi = {
  // Get all jobs for an organization
  getAll: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as JobListing[];
  },

  // Get all active jobs for an organization
  getActive: async (organizationId: string) => {
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as JobListing[];
  },

  // Get job by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as JobListing;
  },

  // Create new job
  create: async (job: Partial<JobListing>) => {
    const { data, error } = await supabase
      .from('job_listings')
      .insert(job)
      .select()
      .single();
    
    if (error) throw error;
    return data as JobListing;
  },

  // Update job
  update: async (id: string, updates: Partial<JobListing>) => {
    const { data, error } = await supabase
      .from('job_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as JobListing;
  },

  // Delete job
  delete: async (id: string) => {
    console.log('Attempting to delete job with id:', id);
    const { error, data } = await supabase
      .from('job_listings')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    console.log('Delete result:', data);
    return data;
  }
};

export const dashboardApi = {
  // Get dashboard statistics for an organization
  getStats: async (organizationId: string) => {
    try {
      // Get total candidates (with job applications)
      const { count: totalCandidates } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Get shortlisted candidates (via job_applications)
      const { count: shortlisted } = await supabase
        .from('job_applications')
        .select('candidate_id, job_listings!inner(organization_id)', { count: 'exact', head: true })
        .eq('status', 'shortlisted')
        .eq('job_listings.organization_id', organizationId);

      // Get pending candidates
      const { count: pending } = await supabase
        .from('job_applications')
        .select('candidate_id, job_listings!inner(organization_id)', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('job_listings.organization_id', organizationId);

      // Get total jobs
      const { count: totalJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Get active jobs
      const { count: activeJobs } = await supabase
        .from('job_listings')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      // Calculate success rate (hired / total applications)
      const { count: hired } = await supabase
        .from('job_applications')
        .select('candidate_id, job_listings!inner(organization_id)', { count: 'exact', head: true })
        .eq('status', 'hired')
        .eq('job_listings.organization_id', organizationId);

      const totalApplications = (totalCandidates || 0);
      const successRate = totalApplications > 0 
        ? Math.round(((hired || 0) / totalApplications) * 100) 
        : 0;

      return {
        total_candidates: totalCandidates || 0,
        shortlisted_count: shortlisted || 0,
        pending_review: pending || 0,
        success_rate: successRate,
        active_jobs: activeJobs || 0
      } as DashboardStats;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

// Authentication helper functions
export const authApi = {
  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};
