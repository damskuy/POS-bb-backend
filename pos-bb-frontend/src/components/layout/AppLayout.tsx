"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { ROUTES } from "@/constants/routes";

export const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authenticated, loading } = useAuth();
  const router = useRouter();

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(false);
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Protect internal routes
  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [authenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Application Shell...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <Sidebar
        isCollapsed={isDesktopCollapsed}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Main Container Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isDesktopCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar
          isDesktopCollapsed={isDesktopCollapsed}
          onToggleDesktopSidebar={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          onToggleMobileSidebar={() => setIsOpenMobile(!isOpenMobile)}
        />

        {/* Page Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
