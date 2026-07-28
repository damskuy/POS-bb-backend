import { NextResponse } from "next/server";
import { defaultNotificationService } from "@/lib/notifications/notification.service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { phone, message } = body;

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

    const result = await defaultNotificationService.sendText({
      phone: phone.trim(),
      message: message.trim(),
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      ...(result.messageId ? { messageId: result.messageId } : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, provider: "fonnte", error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
