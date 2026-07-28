import { NotificationPayload, NotificationResult } from "@/types/notification";

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}
