"use client";

import React from "react";
import Link from "next/link";
import { SidebarItem } from "../navigation/SidebarItem";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isCollapsed: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] border-r border-[#1E293B]">
      {/* Brand Header */}
      <div
        className={`h-20 flex items-center px-5 border-b border-[#1E293B] ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3.5 overflow-hidden group">
          <div className="w-9 h-9 bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white font-extrabold text-lg rounded-xl flex items-center justify-center border border-white/10 shadow-md shrink-0 transition-transform duration-300 group-hover:scale-105">
            P
          </div>
          {/* Smooth collapsing brand title */}
          <div
            className={`flex flex-col transition-all duration-300 ease-in-out ${
              isCollapsed ? "w-0 opacity-0 pointer-events-none translate-x-2" : "w-auto opacity-100 translate-x-0"
            }`}
          >
            <span className="font-extrabold text-white tracking-tight leading-tight text-base font-sans whitespace-nowrap">
              POS Bengkel
            </span>
            <span className="text-[9px] font-extrabold tracking-widest text-[#64748B] uppercase mt-0.5 font-sans whitespace-nowrap">
              Enterprise
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3.5 py-6 space-y-7 custom-scrollbar">
        {/* Main Section */}
        <div>
          {/* Smooth collapsing group label */}
          <h4
            className={`px-3.5 text-[9px] font-extrabold text-[#64748B]/70 uppercase tracking-widest select-none font-sans transition-all duration-300 ease-in-out whitespace-nowrap ${
              isCollapsed ? "opacity-0 h-0 my-0 overflow-hidden" : "opacity-100 h-auto mt-1 mb-2.5"
            }`}
          >
            Main
          </h4>
          <SidebarItem
            href="/dashboard"
            label="Dashboard"
            isCollapsed={isCollapsed}
            onClick={onCloseMobile}
            icon={
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            }
          />
        </div>

        {/* Master Data Section */}
        <div>
          {/* Smooth collapsing group label */}
          <h4
            className={`px-3.5 text-[9px] font-extrabold text-[#64748B]/70 uppercase tracking-widest select-none font-sans transition-all duration-300 ease-in-out whitespace-nowrap ${
              isCollapsed ? "opacity-0 h-0 my-0 overflow-hidden" : "opacity-100 h-auto mt-1 mb-2.5"
            }`}
          >
            Master Data
          </h4>
          <div className="space-y-1">
            <SidebarItem
              href="/customers"
              label="Customers"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
            />
            <SidebarItem
              href="/vehicles"
              label="Vehicles"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              }
            />
            <SidebarItem
              href="/mechanics"
              label="Mechanics"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                </svg>
              }
            />
            <SidebarItem
              href="/services"
              label="Services"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              }
            />
            <SidebarItem
              href="/spare-parts"
              label="Spare Parts"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Transactions Section */}
        <div>
          {/* Smooth collapsing group label */}
          <h4
            className={`px-3.5 text-[9px] font-extrabold text-[#64748B]/70 uppercase tracking-widest select-none font-sans transition-all duration-300 ease-in-out whitespace-nowrap ${
              isCollapsed ? "opacity-0 h-0 my-0 overflow-hidden" : "opacity-100 h-auto mt-1 mb-2.5"
            }`}
          >
            Transactions
          </h4>
          <div className="space-y-1">
            <SidebarItem
              href="/work-orders"
              label="Work Orders"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              badge="Active"
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              }
            />
            <SidebarItem
              href="/invoices"
              label="Invoices"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* System Section */}
        <div>
          {/* Smooth collapsing group label */}
          <h4
            className={`px-3.5 text-[9px] font-extrabold text-[#64748B]/70 uppercase tracking-widest select-none font-sans transition-all duration-300 ease-in-out whitespace-nowrap ${
              isCollapsed ? "opacity-0 h-0 my-0 overflow-hidden" : "opacity-100 h-auto mt-1 mb-2.5"
            }`}
          >
            System
          </h4>
          <div className="space-y-1">
            {user?.role === "OWNER" && (
              <SidebarItem
                href="/dashboard/users"
                label="Users"
                isCollapsed={isCollapsed}
                onClick={onCloseMobile}
                icon={
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                }
              />
            )}

            <SidebarItem
              href="/reports"
              label="Reports"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />
            <SidebarItem
              href="/settings"
              label="Settings"
              isCollapsed={isCollapsed}
              onClick={onCloseMobile}
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        className={`p-4.5 border-t border-[#1E293B] text-[10px] text-[#64748B] font-bold tracking-wider text-center select-none font-sans transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
          isCollapsed ? "h-0 py-0 opacity-0 pointer-events-none border-t-transparent" : "h-auto py-4.5 opacity-100"
        }`}
      >
        POS BENGKEL v1.0.0
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-45 border-r border-[#1E293B] transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-[260px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={onCloseMobile}
          />
          {/* Drawer Content */}
          <div className="relative flex-1 w-full max-w-[260px] bg-[#0F172A] shadow-2xl z-50 transition-transform duration-300 ease-out">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
