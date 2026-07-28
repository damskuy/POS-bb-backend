import { NotificationProvider } from "./provider";
import { NotificationPayload, NotificationResult } from "@/types/notification";

export class FonnteProvider implements NotificationProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FONNTE_API_KEY || "";
    this.baseUrl = "https://api.fonnte.com/send";
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const { phone, message } = payload;

    if (!phone || !phone.trim()) {
      return {
        success: false,
        provider: "fonnte",
        error: "Nomor telepon (phone) wajib diisi",
      };
    }

    if (!message || !message.trim()) {
      return {
        success: false,
        provider: "fonnte",
        error: "Pesan (message) wajib diisi",
      };
    }

    if (!this.apiKey) {
      return {
        success: false,
        provider: "fonnte",
        error: "FONNTE_API_KEY belum dikonfigurasi di environment variables",
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const formData = new URLSearchParams();
      formData.append("target", phone.trim());
      formData.append("message", message.trim());

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: this.apiKey,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            provider: "fonnte",
            error: "Unauthorized: FONNTE_API_KEY tidak valid",
          };
        }
        return {
          success: false,
          provider: "fonnte",
          error: data?.reason || data?.detail || `Fonnte API error with HTTP status ${response.status}`,
        };
      }

      if (data && data.status === false) {
        return {
          success: false,
          provider: "fonnte",
          error: data.reason || data.detail || "Gagal mengirim pesan via Fonnte",
        };
      }

      const messageId = Array.isArray(data?.id)
        ? String(data.id[0])
        : data?.id
        ? String(data.id)
        : undefined;

      return {
        success: true,
        provider: "fonnte",
        ...(messageId ? { messageId } : {}),
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        return {
          success: false,
          provider: "fonnte",
          error: "Request timeout: API Fonnte tidak merespon dalam 10 detik",
        };
      }

      return {
        success: false,
        provider: "fonnte",
        error: error.message || "Gagal terhubung ke server Fonnte",
      };
    }
  }
}
