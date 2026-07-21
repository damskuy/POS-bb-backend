"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: ReactNode;
  isCollapsed?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  label,
  icon,
  isCollapsed = false,
  badge,
  onClick,
}) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
        isActive
          ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
      } ${isCollapsed ? "justify-center px-2" : ""}`}
    >
      <span
        className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
          isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
        }`}
      >
        {icon}
      </span>

      {!isCollapsed && <span className="truncate">{label}</span>}

      {!isCollapsed && badge !== undefined && (
        <span
          className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${
            isActive
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};
