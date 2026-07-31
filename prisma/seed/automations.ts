import { PrismaClient, NotificationTrigger } from "@prisma/client";

export const DEFAULT_AUTOMATIONS = [
  {
    trigger: NotificationTrigger.WORK_ORDER_CREATED,
    name: "Work Order Dibuat",
    description: "Kirim notifikasi ketika Work Order baru berhasil dibuat.",
    isEnabled: true,
  },
  {
    trigger: NotificationTrigger.WORK_ORDER_IN_PROGRESS,
    name: "Pengerjaan Dimulai",
    description: "Kirim notifikasi ketika status Work Order berubah menjadi IN_PROGRESS.",
    isEnabled: true,
  },
  {
    trigger: NotificationTrigger.WORK_ORDER_COMPLETED,
    name: "Pekerjaan Selesai",
    description: "Kirim notifikasi ketika status Work Order berubah menjadi COMPLETED.",
    isEnabled: true,
  },
];

export async function seedNotificationAutomations(prisma: PrismaClient) {
  console.log("Seeding notification automations...");
  const results = [];

  for (const item of DEFAULT_AUTOMATIONS) {
    const automation = await prisma.notificationAutomation.upsert({
      where: { trigger: item.trigger },
      update: {}, // Idempotent: Do not overwrite user-customized fields
      create: {
        trigger: item.trigger,
        name: item.name,
        description: item.description,
        isEnabled: item.isEnabled,
        templateId: null,
      },
    });
    results.push(automation);
  }

  return results;
}
