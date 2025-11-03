'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { authApi } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, User, Mail, Shield, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
              <p className="text-sm md:text-base text-gray-400">Manage your account preferences</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-4xl">
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
    </DashboardLayout>
  );
}
