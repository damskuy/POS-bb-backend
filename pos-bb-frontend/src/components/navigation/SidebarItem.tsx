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
      className={`relative group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out cursor-pointer ${
        isCollapsed ? "px-2 justify-center" : "pl-3.5 pr-3"
      } ${
        isActive
          ? "bg-white/[0.06] text-white font-semibold shadow-xs"
          : "text-[#94A3B8] hover:text-[#CBD5E1] hover:bg-white/[0.03] hover:pl-[17px]"
      }`}
    >
      {/* Thin left accent bar for active menu item */}
      {isActive && !isCollapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-md" />
      )}

      {/* Icon with slight movement on hover */}
      <span
        className={`w-[21px] h-[21px] flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out group-hover:translate-x-[1.5px] ${
          isActive ? "text-white" : "text-[#94A3B8] group-hover:text-[#CBD5E1]"
        }`}
      >
        {icon}
      </span>

      {/* Smoothly animated text label */}
      <span
        className={`truncate tracking-wide transition-all duration-300 ease-in-out whitespace-nowrap ${
          isCollapsed ? "w-0 opacity-0 pointer-events-none translate-x-2" : "w-auto opacity-100 translate-x-0"
        }`}
      >
        {label}
      </span>

      {/* Smoothly animated badge */}
      {badge !== undefined && (
        <span
          className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-0 opacity-0 scale-75 pointer-events-none" : "w-auto opacity-100 scale-100"
          } ${
            isActive
              ? "bg-white/10 text-white"
              : "bg-white/5 text-[#94A3B8] group-hover:bg-white/10 group-hover:text-[#CBD5E1]"
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
};
