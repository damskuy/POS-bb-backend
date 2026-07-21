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
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left section: Hamburger / Collapse Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
          title="Toggle Mobile Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Collapse Sidebar Toggle Button */}
        <button
          onClick={onToggleDesktopSidebar}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
          title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isDesktopCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center text-sm font-medium text-slate-500">
          <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
            POS Bengkel
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">{getBreadcrumbTitle()}</span>
        </nav>
      </div>

      {/* Right section: Search, Notification, & Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Search Placeholder */}
        <div className="relative hidden sm:block w-48 md:w-64">
          <input
            type="text"
            placeholder="Search anything... (⌘K)"
            disabled
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none cursor-not-allowed"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Notification Bell Placeholder */}
        <button
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative"
          title="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="w-2 h-2 bg-blue-600 rounded-full absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Avatar Menu */}
        <AvatarMenu />
      </div>
    </header>
  );
};
