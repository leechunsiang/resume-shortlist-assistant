'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const fetchOrganizations = async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log('[ORG CONTEXT] Already fetching, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);

      const user = await authApi.getCurrentUser();
      if (!user) {
        console.log('[ORG CONTEXT] No user found');
        setOrganizations([]);
        setCurrentOrganizationState(null);
        return;
      }

      // First, activate any pending memberships (only on initial load or refresh)
      if (!hasInitializedRef.current) {
        console.log('[ORG CONTEXT] Activating pending memberships for:', user.email);
        const activated = await organizationMembersApi.activatePendingMemberships(
          user.id,
          user.email || ''
        );
        if (activated.length > 0) {
          console.log('[ORG CONTEXT] Activated memberships:', activated);
        }
        hasInitializedRef.current = true;
      }

      const orgs = await organizationsApi.getUserOrganizations(user.id);
      console.log('[ORG CONTEXT] Fetched', orgs.length, 'organization(s)');
      setOrganizations(orgs);

      // Load saved organization from localStorage or use first one
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      const savedOrg = orgs.find(org => org.id === savedOrgId);

      if (savedOrg) {
        console.log('[ORG CONTEXT] Restored saved organization:', savedOrg.name);
        setCurrentOrganizationState(savedOrg);
        localStorage.setItem('selectedOrganizationId', savedOrg.id); // For RBAC system
      } else if (orgs.length > 0) {
        console.log('[ORG CONTEXT] No saved org, using first:', orgs[0].name);
        setCurrentOrganizationState(orgs[0]);
        localStorage.setItem('currentOrganizationId', orgs[0].id);
        localStorage.setItem('selectedOrganizationId', orgs[0].id); // For RBAC system
      } else {
        console.log('[ORG CONTEXT] No organizations found');
        setCurrentOrganizationState(null);
      }
    } catch (error) {
      console.error('[ORG CONTEXT] Error fetching organizations:', error);
      setOrganizations([]);
      setCurrentOrganizationState(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchOrganizations();

    // Listen for auth changes
    const { data: { subscription } } = authApi.onAuthStateChange((event, session) => {
      console.log('[ORG CONTEXT] Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        hasInitializedRef.current = false; // Reset to allow activation check
        fetchOrganizations();
      } else if (event === 'SIGNED_OUT') {
        console.log('[ORG CONTEXT] User signed out, clearing state');
        setOrganizations([]);
        setCurrentOrganizationState(null);
        localStorage.removeItem('currentOrganizationId');
        localStorage.removeItem('selectedOrganizationId');
        hasInitializedRef.current = false;
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setCurrentOrganization = (org: Organization) => {
    console.log('[ORG CONTEXT] Setting current organization to:', org.name);
    setCurrentOrganizationState(org);
    localStorage.setItem('currentOrganizationId', org.id);
    localStorage.setItem('selectedOrganizationId', org.id); // For RBAC system
  };

  const refreshOrganizations = async () => {
    console.log('[ORG CONTEXT] Manual refresh requested');
    hasInitializedRef.current = false; // Allow re-activation check
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
