"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, Briefcase, Users, Filter, Settings, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth-modal";
import { BeamsBackground } from "@/components/ui/beams-background";
import { clearRoleCache } from "@/lib/rbac";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setIsAuthenticated(!!user);
        setUserEmail(user?.email || null);
        setFirstName(user?.user_metadata?.first_name || null);
        setLastName(user?.user_metadata?.last_name || null);
        setUsername(user?.user_metadata?.username || null);
      } catch (error) {
        setIsAuthenticated(false);
        setUserEmail(null);
        setFirstName(null);
        setLastName(null);
        setUsername(null);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authApi.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
      setFirstName(session?.user?.user_metadata?.first_name || null);
      setLastName(session?.user?.user_metadata?.last_name || null);
      setUsername(session?.user?.user_metadata?.username || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await authApi.signOut();
      clearRoleCache(); // Clear the RBAC cache on logout
      setIsAuthenticated(false);
      setUserEmail(null);
      setFirstName(null);
      setLastName(null);
      setUsername(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (userEmail) return userEmail.charAt(0).toUpperCase();
    return 'G';
  };

  const getDisplayName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    return userEmail || 'Guest';
  };

  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: (
        <LayoutDashboard className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Job Listings",
      href: "/job-listings",
      icon: (
        <Briefcase className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Candidates",
      href: "/candidates",
      icon: (
        <Users className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Filters",
      href: "/filters",
      icon: (
        <Filter className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <Settings className="text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 bg-black border-r border-gray-800">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Logo open={open} />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={link} 
                  disabled={!isAuthenticated && link.label !== "Dashboard"}
                />
              ))}
            </div>
          </div>
          <div>
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-2 py-2">
                  <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {getInitials()}
                  </div>
                  <motion.div
                    animate={{
                      display: open ? "flex" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="flex flex-col overflow-hidden"
                  >
                    <span className="text-neutral-200 text-sm font-medium whitespace-nowrap">
                      {getDisplayName()}
                    </span>
                    {username && (
                      <span className="text-neutral-400 text-xs whitespace-nowrap">
                        @{username}
                      </span>
                    )}
                  </motion.div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-start gap-2 group/sidebar py-2 w-full hover:bg-gray-800 rounded-md transition-colors mt-2 px-2"
                >
                  <LogOut className="text-neutral-200 h-5 w-5 flex-shrink-0" />
                  <motion.span
                    animate={{
                      display: open ? "inline-block" : "none",
                      opacity: open ? 1 : 0,
                    }}
                    className="text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                  >
                    Logout
                  </motion.span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center justify-start gap-2 group/sidebar py-2 w-full hover:bg-emerald-500/20 rounded-md transition-colors px-2 border border-emerald-500/50"
              >
                <LogIn className="text-emerald-400 h-5 w-5 flex-shrink-0" />
                <motion.span
                  animate={{
                    display: open ? "inline-block" : "none",
                    opacity: open ? 1 : 0,
                  }}
                  className="text-emerald-400 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                >
                  Login
                </motion.span>
              </button>
            )}
          </div>
        </SidebarBody>
      </Sidebar>
      
      {/* BeamsBackground as main background - covers entire viewport */}
      <div className="fixed inset-0 -z-10">
        <BeamsBackground intensity="medium" />
      </div>
      
      {/* Main Content with dynamic left margin for fixed sidebar */}
      <motion.div 
        className="min-h-screen relative z-0"
        animate={{
          marginLeft: open ? "280px" : "80px",
        }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1]
        }}
      >
        {children}
      </motion.div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}

export const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <motion.div
        animate={{
          display: open ? "flex" : "none",
          opacity: open ? 1 : 0,
        }}
        className="flex flex-col overflow-hidden"
      >
        <span className="font-semibold text-white whitespace-nowrap">Resume AI</span>
        <span className="text-gray-400 text-xs whitespace-nowrap">Shortlist Assistant</span>
      </motion.div>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex justify-center items-center text-sm py-1 relative z-20"
    >
      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    </Link>
  );
};
