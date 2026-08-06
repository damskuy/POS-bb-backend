"use client";

import React from "react";
import { Settings, CalendarClock, FileText, History, Zap } from "lucide-react";

export type WhatsAppTabType =
  | "whatsapp-settings"
  | "reminder-settings"
  | "notification-templates"
  | "automation-control"
  | "notification-history";

interface WhatsAppTabsProps {
  activeTab: WhatsAppTabType;
  setActiveTab: (tab: WhatsAppTabType) => void;
}

export const WhatsAppTabs: React.FC<WhatsAppTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    {
      id: "whatsapp-settings" as WhatsAppTabType,
      label: "WhatsApp Settings",
      icon: Settings,
    },
    {
      id: "reminder-settings" as WhatsAppTabType,
      label: "Reminder Settings",
      icon: CalendarClock,
    },
    {
      id: "notification-templates" as WhatsAppTabType,
      label: "Notification Templates",
      icon: FileText,
    },
    {
      id: "automation-control" as WhatsAppTabType,
      label: "Automation Control",
      icon: Zap,
    },
    {
      id: "notification-history" as WhatsAppTabType,
      label: "Notification History",
      icon: History,
    },
  ];

  return (
    <div className="w-full bg-[#F1F5F9] p-1 rounded-xl border border-[#ECEFF4] min-h-[44px] flex items-center overflow-x-auto custom-scrollbar">
      <nav className="flex items-center gap-1 min-w-max w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 h-[36px] min-h-[36px] rounded-lg text-[13px] transition-all duration-180 ease-out select-none cursor-pointer shrink-0 ${
                isActive
                  ? "bg-white text-[#0F172A] font-semibold shadow-xs border border-emerald-500/30"
                  : "text-[#64748B] font-medium hover:text-[#0F172A] hover:bg-slate-200/50"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-180 ${
                  isActive ? "text-[#10B981]" : "text-[#64748B]"
                }`}
              />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
