"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AvatarMenu } from "./AvatarMenu";

interface TopNavbarProps {
  onToggleMobileSidebar: () => void;
  onToggleDesktopSidebar: () => void;
  isDesktopCollapsed: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
  isDesktopCollapsed,
}) => {
  const pathname = usePathname();

  // Generate breadcrumb title from pathname
  const getBreadcrumbTitle = (): string => {
    if (pathname === "/dashboard" || pathname === "/") return "Dashboard";
    const segment = pathname.split("/").filter(Boolean)[0];
    if (!segment) return "Dashboard";
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-100 px-6 sm:px-8 flex items-center justify-between">
      {/* Left section: Hamburger / Collapse Toggle & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
          title="Toggle Mobile Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Collapse Sidebar Toggle Button */}
        <button
          onClick={onToggleDesktopSidebar}
          className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
          title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isDesktopCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center text-xs font-semibold text-slate-400 tracking-tight">
          <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
            POS Bengkel
          </Link>
          <span className="mx-2 text-slate-200">/</span>
          <span className="text-slate-700 font-bold">{getBreadcrumbTitle()}</span>
        </nav>
      </div>

      {/* Right section: Search, Notification, & Avatar */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Global Search Placeholder */}
        <div className="relative hidden sm:block w-48 md:w-56">
          <input
            type="text"
            placeholder="Search anything... (⌘K)"
            disabled
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-xl text-[11px] text-slate-600 placeholder-slate-400 focus:outline-none cursor-not-allowed"
          />
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Notification Bell Placeholder */}
        <button
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors relative"
          title="Notifications"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="w-1.5 h-1.5 bg-slate-900 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        {/* Avatar Menu */}
        <AvatarMenu />
      </div>
    </header>
  );
};
