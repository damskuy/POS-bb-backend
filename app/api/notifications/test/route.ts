import { NextResponse } from "next/server";
import { defaultNotificationService } from "@/lib/notifications/notification.service";
import { NotificationHistoryService } from "@/lib/services/notification-history.service";
import { NotificationCategory, NotificationStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { phone, message, recipientName } = body;

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Nomor telepon (phone) wajib diisi" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Pesan (message) wajib diisi" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanMessage = message.trim();

    // 1. Create history record in DB with PENDING status
    const history = await NotificationHistoryService.createHistory({
      recipientName: recipientName || "Test WhatsApp Recipient",
      recipientPhone: cleanPhone,
      category: NotificationCategory.TEST,
      message: cleanMessage,
      status: NotificationStatus.PENDING,
    });

    // 2. Mark as PROCESSING
    await NotificationHistoryService.markProcessing(history.id);

    // 3. Dispatch via Fonnte Provider
    const result = await defaultNotificationService.sendText({
      phone: cleanPhone,
      message: cleanMessage,
    });

    if (!result.success) {
      // 4a. Mark FAILED if failed
      await NotificationHistoryService.markFailed(
        history.id,
        result.error || "Gagal mengirim WhatsApp via Fonnte",
        result
      );
      return NextResponse.json(result, { status: 400 });
    }

    // 4b. Mark SENT if success
    await NotificationHistoryService.markSent(
      history.id,
      result.messageId,
      result
    );

    return NextResponse.json({
      success: true,
      provider: result.provider,
      historyId: history.id,
      ...(result.messageId ? { messageId: result.messageId } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        provider: "fonnte",
        error: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
