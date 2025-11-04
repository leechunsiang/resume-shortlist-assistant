'use client';

import React from 'react';
import { Shield, Check, X, Crown, ShieldCheck, User, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface Permission {
  category: string;
  name: string;
  description: string;
  owner: boolean;
  admin: boolean;
  member: boolean;
  viewer: boolean;
}

const permissions: Permission[] = [
  // Job Permissions
  {
    category: 'Job Listings',
    name: 'View jobs',
    description: 'View all job listings',
    owner: true,
    admin: true,
    member: true,
    viewer: true,
  },
  {
    category: 'Job Listings',
    name: 'Create jobs',
    description: 'Create new job listings',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  {
    category: 'Job Listings',
    name: 'Edit jobs',
    description: 'Modify existing job listings',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  {
    category: 'Job Listings',
    name: 'Delete jobs',
    description: 'Remove job listings',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  {
    category: 'Job Listings',
    name: 'Export jobs',
    description: 'Export job data to CSV/PDF',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  // Candidate Permissions
  {
    category: 'Candidates',
    name: 'View candidates',
    description: 'View candidate profiles',
    owner: true,
    admin: true,
    member: true,
    viewer: true,
  },
  {
    category: 'Candidates',
    name: 'Add candidates',
    description: 'Add new candidates',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  {
    category: 'Candidates',
    name: 'Edit candidates',
    description: 'Modify candidate information',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  {
    category: 'Candidates',
    name: 'Delete candidates',
    description: 'Remove candidates',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  {
    category: 'Candidates',
    name: 'Export candidates',
    description: 'Export candidate data',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  // AI Features
  {
    category: 'AI Features',
    name: 'AI shortlisting',
    description: 'Use AI to shortlist candidates',
    owner: true,
    admin: true,
    member: true,
    viewer: false,
  },
  // Team Management
  {
    category: 'Team Management',
    name: 'View members',
    description: 'View team members',
    owner: true,
    admin: true,
    member: true,
    viewer: true,
  },
  {
    category: 'Team Management',
    name: 'Invite members',
    description: 'Invite new team members',
    owner: true,
    admin: true,
    member: false,
    viewer: false,
  },
  {
    category: 'Team Management',
    name: 'Change roles',
    description: 'Modify member roles',
    owner: true,
    admin: true,
    member: false,
    viewer: false,
  },
  {
    category: 'Team Management',
    name: 'Remove members',
    description: 'Remove team members',
    owner: true,
    admin: true,
    member: false,
    viewer: false,
  },
  // Organization
  {
    category: 'Organization',
    name: 'View settings',
    description: 'View organization settings',
    owner: true,
    admin: true,
    member: false,
    viewer: false,
  },
  {
    category: 'Organization',
    name: 'Edit settings',
    description: 'Modify organization settings',
    owner: true,
    admin: true,
    member: false,
    viewer: false,
  },
  {
    category: 'Organization',
    name: 'View audit logs',
    description: 'View activity audit logs',
    owner: true,
    admin: true,
    member: false,
    viewer: false,
  },
  {
    category: 'Organization',
    name: 'Delete organization',
    description: 'Permanently delete organization',
    owner: true,
    admin: false,
    member: false,
    viewer: false,
  },
  {
    category: 'Organization',
    name: 'Transfer ownership',
    description: 'Transfer ownership to another member',
    owner: true,
    admin: false,
    member: false,
    viewer: false,
  },
];

const roles = [
  {
    key: 'owner',
    name: 'Owner',
    icon: Crown,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    description: 'Full control over the organization',
  },
  {
    key: 'admin',
    name: 'Admin',
    icon: ShieldCheck,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    description: 'Full access except ownership transfer',
  },
  {
    key: 'member',
    name: 'Member',
    icon: User,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: 'Standard access for daily operations',
  },
  {
    key: 'viewer',
    name: 'Viewer',
    icon: Eye,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    description: 'Read-only access',
  },
];

export function RBACMatrix() {
  const categories = Array.from(new Set(permissions.map(p => p.category)));

  return (
    <div className="space-y-8">
      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role, index) => {
          const Icon = role.icon;
          return (
            <motion.div
              key={role.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-6 rounded-lg border ${role.bgColor} ${role.borderColor} backdrop-blur-sm`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-6 h-6 ${role.color}`} />
                <h3 className="text-lg font-semibold text-white">{role.name}</h3>
              </div>
              <p className="text-sm text-gray-400">{role.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 bg-gray-900/80">
                  Permission
                </th>
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <th
                      key={role.key}
                      className="px-6 py-4 text-center text-sm font-semibold text-gray-300 bg-gray-900/80"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Icon className={`w-4 h-4 ${role.color}`} />
                        <span>{role.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const categoryPerms = permissions.filter(p => p.category === category);
                return (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr className="border-t border-gray-800">
                      <td
                        colSpan={5}
                        className="px-6 py-3 text-sm font-semibold text-white bg-gray-800/50"
                      >
                        {category}
                      </td>
                    </tr>
                    {/* Category Permissions */}
                    {categoryPerms.map((perm) => (
                      <tr
                        key={perm.name}
                        className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">{perm.name}</div>
                            <div className="text-xs text-gray-400 mt-1">{perm.description}</div>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={role.key} className="px-6 py-4 text-center">
                            {perm[role.key as keyof Permission] ? (
                              <Check className="w-5 h-5 text-green-400 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-600 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>Has permission</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-gray-600" />
          <span>No permission</span>
        </div>
      </div>
    </div>
  );
}

export function RBACRoleCard({ role }: { role: 'owner' | 'admin' | 'member' | 'viewer' }) {
  const roleConfig = roles.find(r => r.key === role);
  if (!roleConfig) return null;

  const Icon = roleConfig.icon;
  const rolePermissions = permissions.filter(p => p[role]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 rounded-lg border ${roleConfig.bgColor} ${roleConfig.borderColor} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-8 h-8 ${roleConfig.color}`} />
        <div>
          <h3 className="text-xl font-bold text-white">{roleConfig.name}</h3>
          <p className="text-sm text-gray-400">{roleConfig.description}</p>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Permissions ({rolePermissions.length})
        </h4>
        <div className="space-y-2">
          {Array.from(new Set(rolePermissions.map(p => p.category))).map(category => {
            const catPerms = rolePermissions.filter(p => p.category === category);
            return (
              <div key={category}>
                <div className="text-xs font-medium text-gray-500 mb-1">{category}</div>
                <ul className="space-y-1">
                  {catPerms.map(perm => (
                    <li key={perm.name} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <span>{perm.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
