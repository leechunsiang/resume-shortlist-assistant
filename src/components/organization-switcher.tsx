'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrganization } from '@/contexts/organization-context';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function OrganizationSwitcher() {
  const { organizations, currentOrganization, setCurrentOrganization, loading } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all flex items-center gap-2"
      >
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <div className="text-sm font-medium text-white truncate">
            {currentOrganization?.name || 'Select Organization'}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-[100]"
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
                    <div className="text-sm font-medium text-white truncate">{org.name}</div>
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
    </div>
  );
}
