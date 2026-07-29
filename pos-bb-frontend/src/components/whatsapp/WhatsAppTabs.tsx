"use client";

import React from "react";
import { Settings, CalendarClock, FileText, History } from "lucide-react";

export type WhatsAppTabType =
  | "whatsapp-settings"
  | "reminder-settings"
  | "notification-templates"
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
      id: "notification-history" as WhatsAppTabType,
      label: "Notification History",
      icon: History,
    },
  ];

  return (
    <div className="w-full bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70 mb-6 overflow-x-auto custom-scrollbar">
      <nav className="flex items-center gap-1.5 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 select-none ${
                isActive
                  ? "bg-[#25D366] text-white shadow-md shadow-[#25D366]/20 font-bold translate-y-[-1px]"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform duration-200 ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
