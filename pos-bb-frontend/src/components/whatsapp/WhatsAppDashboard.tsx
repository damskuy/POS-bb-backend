"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/common";
import { WhatsAppHeader } from "./WhatsAppHeader";
import { WhatsAppSummaryCards } from "./WhatsAppSummaryCards";
import { WhatsAppTabs, WhatsAppTabType } from "./WhatsAppTabs";
import { WhatsAppSettingsTab } from "./WhatsAppSettingsTab";
import { ReminderSettingsTab } from "./ReminderSettingsTab";
import { NotificationTemplatesTab } from "./NotificationTemplatesTab";
import { NotificationHistoryTab } from "./NotificationHistoryTab";
import { AutomationControlTab } from "./AutomationControlTab";

export const WhatsAppDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WhatsAppTabType>("whatsapp-settings");

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 space-y-5 md:space-y-8 animate-fadeIn overflow-x-hidden">
      {/* 1. Page Title & Header */}
      <WhatsAppHeader />

      {/* 2. Horizontal Tab Navigation (Swipeable / Scrollable on mobile) */}
      <WhatsAppTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 3. Top 4 Summary KPI Cards (2 columns on mobile, 4 on desktop) */}
      {activeTab === "whatsapp-settings" && <WhatsAppSummaryCards />}

      {/* 4. Active Tab Content */}
      <div className="w-full">
        {activeTab === "whatsapp-settings" && <WhatsAppSettingsTab />}
        {activeTab === "reminder-settings" && <ReminderSettingsTab />}
        {activeTab === "notification-templates" && <NotificationTemplatesTab />}
        {activeTab === "automation-control" && (
          <AutomationControlTab
            onNavigateToTemplates={() => setActiveTab("notification-templates")}
          />
        )}
        {activeTab === "notification-history" && <NotificationHistoryTab />}
      </div>
    </div>
  );
};
