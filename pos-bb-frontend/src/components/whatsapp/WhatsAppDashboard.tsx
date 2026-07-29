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

export const WhatsAppDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WhatsAppTabType>("whatsapp-settings");

  return (
    <PageContainer>
      {/* 1. Page Title & Header */}
      <WhatsAppHeader />

      {/* 2. Horizontal Tab Navigation (Moved ABOVE Summary Cards & Overview Removed) */}
      <WhatsAppTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 3. Top 4 Summary Cards (Hidden on Reminder Settings tab) */}
      {activeTab !== "reminder-settings" && <WhatsAppSummaryCards />}

      {/* 4. Active Tab Content */}
      <div className="pt-2">
        {activeTab === "whatsapp-settings" && <WhatsAppSettingsTab />}
        {activeTab === "reminder-settings" && <ReminderSettingsTab />}
        {activeTab === "notification-templates" && <NotificationTemplatesTab />}
        {activeTab === "notification-history" && <NotificationHistoryTab />}
      </div>
    </PageContainer>
  );
};
