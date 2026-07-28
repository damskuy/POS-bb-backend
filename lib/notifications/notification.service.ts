import { NotificationProvider } from "@/lib/whatsapp/provider";
import { FonnteProvider } from "@/lib/whatsapp/fonnte.provider";
import { NotificationPayload, NotificationResult } from "@/types/notification";

export class NotificationService {
  private provider: NotificationProvider;

  constructor(provider?: NotificationProvider) {
    this.provider = provider || new FonnteProvider();
  }

  async sendText(payload: NotificationPayload): Promise<NotificationResult> {
    return this.provider.send(payload);
  }

  async sendEstimate(payload: NotificationPayload): Promise<NotificationResult> {
    return this.provider.send(payload);
  }

  async sendInvoice(payload: NotificationPayload): Promise<NotificationResult> {
    return this.provider.send(payload);
  }

  async sendServiceDone(payload: NotificationPayload): Promise<NotificationResult> {
    return this.provider.send(payload);
  }

  async sendReminder(payload: NotificationPayload): Promise<NotificationResult> {
    return this.provider.send(payload);
  }
}

export const defaultNotificationService = new NotificationService();
