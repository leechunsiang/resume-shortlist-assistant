'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, organizationsApi, authApi, organizationMembersApi } from '@/lib/supabase';

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  loading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (!user) {
        setOrganizations([]);
        setCurrentOrganizationState(null);
        setLoading(false);
        return;
      }

      // First, activate any pending memberships
      console.log('[ORG CONTEXT] Activating pending memberships for:', user.email);
      const activated = await organizationMembersApi.activatePendingMemberships(
        user.id,
        user.email || ''
      );
      if (activated.length > 0) {
        console.log('[ORG CONTEXT] Activated memberships:', activated);
      }

      const orgs = await organizationsApi.getUserOrganizations(user.id);
      console.log('[ORG CONTEXT] Fetched organizations:', orgs);
      setOrganizations(orgs);

      // Load saved organization from localStorage or use first one
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      const savedOrg = orgs.find(org => org.id === savedOrgId);

      if (savedOrg) {
        console.log('[ORG CONTEXT] Restored saved organization:', savedOrg.name, savedOrg.id);
        setCurrentOrganizationState(savedOrg);
        localStorage.setItem('selectedOrganizationId', savedOrg.id); // For RBAC system
      } else if (orgs.length > 0) {
        console.log('[ORG CONTEXT] No saved org, using first:', orgs[0].name, orgs[0].id);
        setCurrentOrganizationState(orgs[0]);
        localStorage.setItem('currentOrganizationId', orgs[0].id);
        localStorage.setItem('selectedOrganizationId', orgs[0].id); // For RBAC system
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();

    // Listen for auth changes
    const { data: { subscription } } = authApi.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchOrganizations();
      } else if (event === 'SIGNED_OUT') {
        setOrganizations([]);
        setCurrentOrganizationState(null);
        localStorage.removeItem('currentOrganizationId');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setCurrentOrganization = (org: Organization) => {
    console.log('[ORG CONTEXT] Setting current organization to:', org.name, org.id);
    setCurrentOrganizationState(org);
    localStorage.setItem('currentOrganizationId', org.id);
    localStorage.setItem('selectedOrganizationId', org.id); // For RBAC system
  };

  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        loading,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
