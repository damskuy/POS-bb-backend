export type ReminderTriggerType = "DAYS" | "KM" | "BOTH";

export type ReminderCategory =
  | "SERVIS"
  | "PERAWATAN"
  | "BAN"
  | "KELISTRIKAN"
  | "REM";

export interface ReminderRule {
  id: number;
  name: string;
  description: string | null;
  category: ReminderCategory;
  triggerType: ReminderTriggerType;
  daysInterval: number | null;
  kmInterval: number | null;
  messageTemplate: string;
  sendTime: string;
  timezone: string;
  sendDays: string;
  skipHolidays: boolean;
  retryOnFailure: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ReminderRuleInput = Omit<
  ReminderRule,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
