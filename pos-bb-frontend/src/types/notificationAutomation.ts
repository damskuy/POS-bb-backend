export type NotificationTrigger =
  | "WORK_ORDER_CREATED"
  | "WORK_ORDER_IN_PROGRESS"
  | "WORK_ORDER_COMPLETED";

export interface AutomationTemplate {
  id: number;
  name: string;
  category: string;
  message: string;
}

export interface NotificationAutomation {
  id: number;
  name: string;
  description: string | null;
  trigger: NotificationTrigger;
  isEnabled: boolean;
  templateId: number | null;
  template: AutomationTemplate | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationAutomationUpdateInput = {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  templateId?: number | null;
};
