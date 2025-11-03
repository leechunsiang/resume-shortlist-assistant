'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { authApi, organizationsApi, organizationMembersApi, Organization, OrganizationMember } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, User, Mail, Shield, Settings as SettingsIcon, Building2, Users, UserPlus, Crown, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

type TabType = 'account' | 'organization' | 'team';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Organization state
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        
        // Fetch user's organization
        const orgs = await organizationsApi.getUserOrganizations(currentUser.id);
        if (orgs && orgs.length > 0) {
          setOrganization(orgs[0]); // Get first organization
          
          // Fetch organization members
          const orgMembers = await organizationMembersApi.getMembers(orgs[0].id);
          setMembers(orgMembers);
          
          // Get current user's role
          const userMember = orgMembers.find(m => m.user_id === currentUser.id);
          setCurrentUserRole(userMember?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

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
    if (!newMemberUsername.trim()) {
      setAddMemberError('Please enter a username');
      return;
    }

    if (!organization) {
      setAddMemberError('No organization found');
      return;
    }

    setIsAddingMember(true);
    setAddMemberError(null);

    try {
      const response = await fetch('/api/organization/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newMemberUsername.trim(),
          role: newMemberRole,
          organizationId: organization.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member');
      }

      // Refresh members list
      const orgMembers = await organizationMembersApi.getMembers(organization.id);
      setMembers(orgMembers);
      
      // Close modal and reset form
      setShowAddMemberModal(false);
      setNewMemberUsername('');
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
            {organization && (
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

        <div className="p-4 md:p-8 max-w-4xl">
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
          {activeTab === 'organization' && organization && (
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
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Organization Name</label>
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                    <span className="text-white font-medium">{organization.name}</span>
                  </div>
                </div>

                {organization.description && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Description</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{organization.description}</span>
                    </div>
                  </div>
                )}

                {organization.industry && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Industry</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{organization.industry}</span>
                    </div>
                  </div>
                )}

                {organization.size && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Company Size</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <span className="text-white">{organization.size} employees</span>
                    </div>
                  </div>
                )}

                {organization.website && (
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Website</label>
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3">
                      <a 
                        href={organization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {organization.website}
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
                    <span className="text-white">{new Date(organization.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && organization && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Team Members</h2>
                  <span className="text-sm text-gray-400">({members.length})</span>
                </div>
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
                        </div>
                        <div className="text-xs text-gray-400">
                          Joined {new Date(member.joined_at || member.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.role)}`}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
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
              Add a user to your organization by their username.
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newMemberUsername}
                  onChange={(e) => {
                    setNewMemberUsername(e.target.value);
                    setAddMemberError(null);
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter username (e.g., john_doe)"
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
                  setNewMemberUsername('');
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
                disabled={isAddingMember || !newMemberUsername.trim()}
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
    </DashboardLayout>
  );
}
