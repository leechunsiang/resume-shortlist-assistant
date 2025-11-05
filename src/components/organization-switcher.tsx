'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrganization } from '@/contexts/organization-context';
import { Building2, ChevronDown, Check, Plus, Crown, Shield, User, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const getRoleIcon = (role?: string) => {
  switch (role) {
    case 'owner':
      return <Crown className="w-3 h-3" />;
    case 'admin':
      return <Shield className="w-3 h-3" />;
    case 'member':
      return <User className="w-3 h-3" />;
    case 'viewer':
      return <Eye className="w-3 h-3" />;
    default:
      return null;
  }
};

const getRoleColor = (role?: string) => {
  switch (role) {
    case 'owner':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    case 'admin':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    case 'member':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    case 'viewer':
      return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    default:
      return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
  }
};

export function OrganizationSwitcher() {
  const { organizations, currentOrganization, setCurrentOrganization, loading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  if (loading) {
    return (
      <div className="px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <button
        onClick={() => router.push('/organization/setup')}
        className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg border border-emerald-500/50 transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-emerald-400 font-medium">Create Organization</span>
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all flex items-center gap-2"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {currentOrganization?.name || 'Select Organization'}
            </span>
            {currentOrganization?.role && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0 ${getRoleColor(currentOrganization.role)}`}>
                {getRoleIcon(currentOrganization.role)}
                <span className="capitalize">{currentOrganization.role}</span>
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-[9999]"
          >
            <div className="py-1">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setCurrentOrganization(org);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2 text-left"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white truncate">{org.name}</span>
                      {org.role && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRoleColor(org.role)}`}>
                          {getRoleIcon(org.role)}
                          <span className="capitalize">{org.role}</span>
                        </span>
                      )}
                    </div>
                    {org.description && (
                      <div className="text-xs text-gray-400 truncate">{org.description}</div>
                    )}
                  </div>
                  {currentOrganization?.id === org.id && (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-700">
              <button
                onClick={() => {
                  router.push('/organization/setup');
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 hover:bg-gray-700 transition-colors flex items-center gap-2 text-emerald-400"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create New Organization</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
