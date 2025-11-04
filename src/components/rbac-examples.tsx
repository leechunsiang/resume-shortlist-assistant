'use client';

/**
 * Example Component: Job Actions with RBAC
 * 
 * This component demonstrates how to implement role-based access control
 * for job listing actions (view, edit, delete, export)
 */

import { useState, useEffect } from 'react';
import { usePermissions, useRole } from '@/lib/rbac';
import { Edit, Trash2, Download, Eye, Lock } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department: string;
  status: string;
}

export function JobActionsExample({ job }: { job: Job }) {
  const { can } = usePermissions();
  const { isViewer } = useRole();
  
  // Permission states
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [isViewerRole, setIsViewerRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      setLoading(true);
      const [view, edit, del, exp, viewer] = await Promise.all([
        can('jobs.read'),
        can('jobs.update'),
        can('jobs.delete'),
        can('jobs.export'),
        isViewer(),
      ]);
      
      setCanView(view);
      setCanEdit(edit);
      setCanDelete(del);
      setCanExport(exp);
      setIsViewerRole(viewer);
      setLoading(false);
    };

    checkPermissions();
  }, [can, isViewer]);

  const handleEdit = () => {
    console.log('Edit job:', job.id);
    // Navigate to edit page or open modal
  };

  const handleDelete = () => {
    console.log('Delete job:', job.id);
    // Show confirmation modal then delete
  };

  const handleExport = () => {
    console.log('Export job:', job.id);
    // Export job data
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-800 animate-pulse rounded"></div>
        <div className="w-8 h-8 bg-gray-800 animate-pulse rounded"></div>
        <div className="w-8 h-8 bg-gray-800 animate-pulse rounded"></div>
      </div>
    );
  }

  // If user can't even view, show nothing or access denied
  if (!canView) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Lock className="w-4 h-4" />
        <span>Access Denied</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* View Button - Always visible if canView */}
      <button
        onClick={() => console.log('View job:', job.id)}
        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        title="View job details"
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Edit Button - Only for users with edit permission */}
      {canEdit && (
        <button
          onClick={handleEdit}
          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
          title="Edit job"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      {/* Delete Button - Only for users with delete permission */}
      {canDelete && (
        <button
          onClick={handleDelete}
          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
          title="Delete job"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Export Button - Only for users with export permission */}
      {canExport && (
        <button
          onClick={handleExport}
          className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
          title="Export job data"
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      {/* Show viewer badge if user is a viewer */}
      {isViewerRole && (
        <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-full">
          View Only
        </span>
      )}
    </div>
  );
}

/**
 * Example Component: Conditional Form Access
 */
export function JobFormExample() {
  const { can } = usePermissions();
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      setLoading(true);
      const [create, update] = await Promise.all([
        can('jobs.create'),
        can('jobs.update'),
      ]);
      
      setCanCreate(create);
      setCanUpdate(update);
      setLoading(false);
    };

    checkPermissions();
  }, [can]);

  if (loading) {
    return <div>Loading form...</div>;
  }

  if (!canCreate && !canUpdate) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Access Denied</h3>
        </div>
        <p className="text-gray-300">
          You don't have permission to create or edit jobs. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Job Title
        </label>
        <input
          type="text"
          disabled={!canCreate && !canUpdate}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Department
        </label>
        <input
          type="text"
          disabled={!canCreate && !canUpdate}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={!canCreate && !canUpdate}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {canCreate ? 'Create Job' : 'Update Job'}
      </button>
    </form>
  );
}

/**
 * Example Component: Role-Based Dashboard
 */
export function RoleBasedDashboard() {
  const { isOwner, isAdmin, isMember, isViewer } = useRole();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      setLoading(true);
      const [owner, admin, member, viewer] = await Promise.all([
        isOwner(),
        isAdmin(),
        isMember(),
        isViewer(),
      ]);

      if (owner) setRole('owner');
      else if (admin) setRole('admin');
      else if (member) setRole('member');
      else if (viewer) setRole('viewer');
      
      setLoading(false);
    };

    checkRole();
  }, [isOwner, isAdmin, isMember, isViewer]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-2">
          Welcome to Your Dashboard
        </h2>
        <p className="text-gray-400">
          Your role: <span className="font-semibold text-white capitalize">{role}</span>
        </p>
      </div>

      {/* Owner-only section */}
      {role === 'owner' && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">Owner Controls</h3>
          <p className="text-gray-300 mb-4">
            You have full control over this organization.
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
              Transfer Ownership
            </button>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
              Delete Organization
            </button>
          </div>
        </div>
      )}

      {/* Admin/Owner section */}
      {(role === 'owner' || role === 'admin') && (
        <div className="p-4 bg-purple-900/20 border border-purple-500/50 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">Admin Tools</h3>
          <p className="text-gray-300 mb-4">
            Manage your team and organization settings.
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
              Manage Team
            </button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
              View Audit Logs
            </button>
          </div>
        </div>
      )}

      {/* All users section */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">Your Work</h3>
        <p className="text-gray-300 mb-4">
          {role === 'viewer' 
            ? 'View jobs and candidates in your organization.'
            : 'Manage jobs and candidates in your organization.'
          }
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            View Jobs
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            View Candidates
          </button>
          {role !== 'viewer' && (
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
              Use AI Shortlist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
