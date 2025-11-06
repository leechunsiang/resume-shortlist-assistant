'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { authApi, organizationsApi, organizationMembersApi, Organization, OrganizationMember } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, User, Mail, Shield, Settings as SettingsIcon, Building2, Users, UserPlus, Crown, ShieldCheck, MoreVertical, Edit, UserMinus, RefreshCw, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrganization } from '@/contexts/organization-context';
import { OrganizationSwitcher } from '@/components/organization-switcher';

type TabType = 'account' | 'organization' | 'team';

export default function SettingsPage() {
  const router = useRouter();
  const { currentOrganization, refreshOrganizations } = useOrganization();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Organization state
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isRefreshingMembers, setIsRefreshingMembers] = useState(false);
  
  // Manage member state
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [manageMemberError, setManageMemberError] = useState<string | null>(null);
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [newRole, setNewRole] = useState<'owner' | 'admin' | 'member' | 'viewer'>('member');
  
  // Create organization state
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [createOrgFormData, setCreateOrgFormData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '1-10',
    department: '',
    job_role: '',
    expected_resume_volume: '1-50',
  });
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Fetch members when organization changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (currentOrganization) {
        try {
          const orgMembers = await organizationMembersApi.getMembers(currentOrganization.id);
          setMembers(orgMembers);
          
          // Get current user's role
          if (user) {
            const userMember = orgMembers.find(m => m.user_id === user.id);
            setCurrentUserRole(userMember?.role || null);
          }
        } catch (error) {
          console.error('Error fetching members:', error);
        }
      }
    };

    fetchMembers();
  }, [currentOrganization, user]);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await authApi.deleteAccount();
      // Redirect to home page after successful deletion
      router.push('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const errorMessage = error?.message || 'Failed to delete account. Please try again or contact support.';
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setAddMemberError('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail.trim())) {
      setAddMemberError('Please enter a valid email address');
      return;
    }

    if (!currentOrganization) {
      setAddMemberError('No organization found');
      return;
    }

    setIsAddingMember(true);
    setAddMemberError(null);

    try {
      // Get the current session to send auth token
      const session = await authApi.getSession();
      
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const response = await fetch('/api/organization/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole,
          organizationId: currentOrganization.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      // Refresh members list
      if (currentOrganization) {
        const orgMembers = await organizationMembersApi.getMembers(currentOrganization.id);
        setMembers(orgMembers);
      }

      // Refresh organizations context (in case a new user just signed up)
      await refreshOrganizations();
      
      // Close modal and reset form
      setShowAddMemberModal(false);
      setNewMemberEmail('');
      setNewMemberRole('member');
    } catch (error: any) {
      console.error('Error adding member:', error);
      setAddMemberError(error.message || 'Failed to add member. Please try again.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      case 'member':
        return <User className="w-4 h-4 text-green-400" />;
      case 'viewer':
        return <User className="w-4 h-4 text-gray-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'member':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const handleManageMember = (member: OrganizationMember) => {
    setSelectedMember(member);
    setNewRole(member.role as any);
    setShowManageModal(true);
    setManageMemberError(null);
  };

  const handleUpdateRole = async () => {
    if (!selectedMember || !currentOrganization) return;

    setIsUpdatingMember(true);
    setManageMemberError(null);

    try {
      const session = await authApi.getSession();
      
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const response = await fetch('/api/organization/update-member', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          role: newRole,
          organizationId: currentOrganization.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member role');
      }

      // Refresh members list
      const orgMembers = await organizationMembersApi.getMembers(currentOrganization.id);
      setMembers(orgMembers);
      
      // Close modal
      setShowManageModal(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Error updating member:', error);
      setManageMemberError(error.message || 'Failed to update member. Please try again.');
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember || !currentOrganization) return;

    setIsDeletingMember(true);
    setManageMemberError(null);

    try {
      const session = await authApi.getSession();
      
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const response = await fetch('/api/organization/delete-member', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          organizationId: currentOrganization.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      // Refresh members list
      const orgMembers = await organizationMembersApi.getMembers(currentOrganization.id);
      setMembers(orgMembers);
      
      // Close modals
      setShowDeleteConfirmModal(false);
      setShowManageModal(false);
      setSelectedMember(null);
    } catch (error: any) {
      console.error('Error deleting member:', error);
      setManageMemberError(error.message || 'Failed to remove member. Please try again.');
    } finally {
      setIsDeletingMember(false);
    }
  };

  const handleRefreshMembers = async () => {
    if (!currentOrganization || !user) return;
    
    setIsRefreshingMembers(true);
    try {
      // Try to activate any pending memberships
      console.log('[REFRESH] Checking for pending memberships...');
      await organizationMembersApi.activatePendingMemberships(user.id, user.email || '');
      
      // Refresh the member list
      const orgMembers = await organizationMembersApi.getMembers(currentOrganization.id);
      setMembers(orgMembers);
      
      // Also refresh organizations in context
      await refreshOrganizations();
      
      console.log('[REFRESH] Members refreshed successfully');
    } catch (error) {
      console.error('[REFRESH] Error refreshing members:', error);
    } finally {
      setIsRefreshingMembers(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!createOrgFormData.name.trim()) {
      setCreateOrgError('Organization name is required');
      return;
    }

    if (!user) {
      setCreateOrgError('No user found. Please log in again.');
      return;
    }

    setIsCreatingOrg(true);
    setCreateOrgError(null);

    try {
      await organizationsApi.create({
        ...createOrgFormData,
        created_by: user.id,
      });

      // Refresh organizations in context
      await refreshOrganizations();

      // Close modal and reset form
      setShowCreateOrgModal(false);
      setCreateOrgFormData({
        name: '',
        website: '',
        industry: '',
        size: '1-10',
        department: '',
        job_role: '',
        expected_resume_volume: '1-50',
      });
    } catch (error: any) {
      console.error('Error creating organization:', error);
      setCreateOrgError(error.message || 'Failed to create organization. Please try again.');
    } finally {
      setIsCreatingOrg(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-transparent px-4 md:px-8 py-4 md:py-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
              <p className="text-sm md:text-base text-gray-400">Manage your account and organization</p>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="px-4 md:px-8 pt-6">
          <div className="flex gap-2 border-b border-gray-800/50 pb-2">
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'account'
                  ? 'bg-gray-800/50 text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </button>
            {currentOrganization && (
              <>
                <button
                  onClick={() => setActiveTab('organization')}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'organization'
                      ? 'bg-gray-800/50 text-indigo-400 border-b-2 border-indigo-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Organization
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
                    activeTab === 'team'
                      ? 'bg-gray-800/50 text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Team
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                    {members.length}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-4xl overflow-visible">
          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <>
              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Email</label>
                    <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{user?.email}</span>
                    </div>
                  </div>

                  {user?.user_metadata?.first_name && (
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Name</label>
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                        <span className="text-white">
                          {user.user_metadata.first_name} {user.user_metadata.last_name}
                        </span>
                      </div>
                    </div>
                  )}

                  {user?.user_metadata?.username && (
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">Username</label>
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                        <span className="text-white">@{user.user_metadata.username}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Account Security */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Account Security</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">Account created: {new Date(user?.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-gray-300 text-sm">Last sign in: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </motion.div>

              {/* Danger Zone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-red-900/20 backdrop-blur-xl border border-red-500/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
                </div>
                
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-300 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <ul className="text-xs text-gray-400 mb-4 space-y-1 list-disc list-inside">
                    <li>All your personal information will be deleted</li>
                    <li>Organizations where you're the only owner will be deleted</li>
                    <li>Your memberships in other organizations will be removed</li>
                    <li>All candidates, jobs, and applications you created will be removed</li>
                  </ul>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete My Account
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && currentOrganization && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-semibold text-white">Organization Details</h2>
                </div>
                <button
                  onClick={() => setShowCreateOrgModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Organization
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Organization Name</label>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                    <span className="text-white font-medium">{currentOrganization.name}</span>
                  </div>
                </div>

                {currentOrganization.department && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Department</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{currentOrganization.department}</span>
                    </div>
                  </div>
                )}

                {currentOrganization.job_role && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Job Role</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{currentOrganization.job_role}</span>
                    </div>
                  </div>
                )}

                {currentOrganization.industry && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Industry</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{currentOrganization.industry}</span>
                    </div>
                  </div>
                )}

                {currentOrganization.size && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Company Size</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{currentOrganization.size} employees</span>
                    </div>
                  </div>
                )}

                {currentOrganization.expected_resume_volume && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Expected Resume Volume</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{currentOrganization.expected_resume_volume}</span>
                    </div>
                  </div>
                )}

                {currentOrganization.website && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Website</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <a 
                        href={currentOrganization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {currentOrganization.website}
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Your Role</label>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-2">
                    {getRoleIcon(currentUserRole || '')}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(currentUserRole || '')}`}>
                      {currentUserRole?.charAt(0).toUpperCase()}{currentUserRole?.slice(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Created</label>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                    <span className="text-white">{new Date(currentOrganization.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && currentOrganization && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Team Members Section */}
              <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-semibold text-white">Team Members</h2>
                    <span className="text-sm text-gray-400">({members.length})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Organization Switcher */}
                    <div className="w-64 relative z-50">
                      <OrganizationSwitcher />
                    </div>
                    
                    <button
                      onClick={handleRefreshMembers}
                      disabled={isRefreshingMembers}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh member list and activate pending invitations"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingMembers ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Member
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{member.user_email}</span>
                          {member.user_id === user?.id && (
                            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">(You)</span>
                          )}
                          {member.status === 'pending' && (
                            <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">Pending</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          Joined {new Date(member.joined_at || member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </div>
                      {(currentUserRole === 'owner' || currentUserRole === 'admin') && member.user_id !== user?.id && (
                        <button
                          onClick={() => handleManageMember(member)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Manage member"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-red-500/50 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Delete Account?</h2>
            </div>

            <p className="text-gray-300 mb-4">
              This action is permanent and cannot be undone. All your data will be deleted immediately.
            </p>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-300 mb-2">
                Type <span className="font-bold">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => {
                  setDeleteConfirmation(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                placeholder="Type DELETE"
                autoFocus
              />
              {deleteError && (
                <p className="text-xs text-red-400 mt-2">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Forever
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Add Team Member</h2>
            </div>

            <p className="text-gray-300 mb-4">
              Add a user to your organization by their email address.
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => {
                    setNewMemberEmail(e.target.value);
                    setAddMemberError(null);
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter email (e.g., john@example.com)"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as 'admin' | 'member' | 'viewer')}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="member">Member - Can view and edit</option>
                  <option value="admin">Admin - Full access except ownership</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>

              {addMemberError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{addMemberError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setNewMemberEmail('');
                  setNewMemberRole('member');
                  setAddMemberError(null);
                }}
                disabled={isAddingMember}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={isAddingMember || !newMemberEmail.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingMember ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manage Member Modal */}
      {showManageModal && selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-purple-500/50 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Edit className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Manage Team Member</h2>
            </div>

            <div className="mb-4">
              <p className="text-gray-300 mb-2">Managing:</p>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-medium">{selectedMember.user_email}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Current role: {selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1)}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Change Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {currentUserRole === 'owner' && <option value="owner">Owner - Full control</option>}
                  <option value="admin">Admin - Full access except ownership</option>
                  <option value="member">Member - Can view and edit</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>

              {manageMemberError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{manageMemberError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setSelectedMember(null);
                  setManageMemberError(null);
                }}
                disabled={isUpdatingMember}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isUpdatingMember || newRole === selectedMember.role}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingMember ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    Update Role
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowDeleteConfirmModal(true)}
                disabled={isUpdatingMember}
                className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-500/50"
              >
                <UserMinus className="w-4 h-4" />
                Remove from Organization
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {showDeleteConfirmModal && selectedMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-red-500/50 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Remove Member?</h2>
            </div>

            <p className="text-gray-300 mb-4">
              Are you sure you want to remove <span className="font-semibold text-white">{selectedMember.user_email}</span> from the organization?
            </p>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-300">
                This action cannot be undone. The member will lose access to all organization resources.
              </p>
            </div>

            {manageMemberError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-400">{manageMemberError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setManageMemberError(null);
                }}
                disabled={isDeletingMember}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={isDeletingMember}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingMember ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Removing...
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Remove Member
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-indigo-500/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Create New Organization</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Create an additional organization to manage separately.
            </p>

            <div className="space-y-4 mb-6">
              {/* Organization Name */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Organization Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createOrgFormData.name}
                  onChange={(e) => {
                    setCreateOrgFormData(prev => ({ ...prev, name: e.target.value }));
                    setCreateOrgError(null);
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Acme Corporation"
                  autoFocus
                />
              </div>

              {/* Department & Job Role Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={createOrgFormData.department}
                    onChange={(e) => setCreateOrgFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Engineering, HR"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Your Job Role
                  </label>
                  <input
                    type="text"
                    value={createOrgFormData.job_role}
                    onChange={(e) => setCreateOrgFormData(prev => ({ ...prev, job_role: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., HR Manager, Recruiter"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Website <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={createOrgFormData.website}
                  onChange={(e) => setCreateOrgFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Industry & Size Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={createOrgFormData.industry}
                    onChange={(e) => setCreateOrgFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Technology"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Company Size
                  </label>
                  <select
                    value={createOrgFormData.size}
                    onChange={(e) => setCreateOrgFormData(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              {/* Expected Resume Volume */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Expected Resume Upload Volume <span className="text-xs text-gray-500">(per job posting)</span>
                </label>
                <select
                  value={createOrgFormData.expected_resume_volume}
                  onChange={(e) => setCreateOrgFormData(prev => ({ ...prev, expected_resume_volume: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="1-50">1 job posting = 1-50 resumes</option>
                  <option value="51-100">2 job postings = 51-100 resumes</option>
                  <option value="101-200">3-4 job postings = 101-200 resumes</option>
                  <option value="201-500">5-10 job postings = 201-500 resumes</option>
                  <option value="500+">10+ job postings = 500+ resumes</option>
                </select>
              </div>

              {createOrgError && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{createOrgError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateOrgModal(false);
                  setCreateOrgFormData({
                    name: '',
                    website: '',
                    industry: '',
                    size: '1-10',
                    department: '',
                    job_role: '',
                    expected_resume_volume: '1-50',
                  });
                  setCreateOrgError(null);
                }}
                disabled={isCreatingOrg}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrganization}
                disabled={isCreatingOrg || !createOrgFormData.name.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreatingOrg ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Organization
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
