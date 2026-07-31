import { prisma } from "@/lib/prisma";
import { NotificationTrigger, NotificationAutomation } from "@prisma/client";
import { UpdateNotificationAutomationInput } from "@/lib/validators/notificationAutomation";
import { seedNotificationAutomations } from "@/prisma/seed/automations";

export const NotificationAutomationService = {
  /**
   * Ensures the 3 default automations exist in the database (idempotent).
   */
  ensureDefaultAutomations: async (): Promise<void> => {
    await seedNotificationAutomations(prisma);
  },

  /**
   * Get all notification automations, ordered by business flow:
   * WORK_ORDER_CREATED -> WORK_ORDER_IN_PROGRESS -> WORK_ORDER_COMPLETED
   */
  getAll: async () => {
    await NotificationAutomationService.ensureDefaultAutomations();

    const automations = await prisma.notificationAutomation.findMany({
      include: {
        template: true,
      },
    });

    const orderMap: Record<NotificationTrigger, number> = {
      [NotificationTrigger.WORK_ORDER_CREATED]: 1,
      [NotificationTrigger.WORK_ORDER_IN_PROGRESS]: 2,
      [NotificationTrigger.WORK_ORDER_COMPLETED]: 3,
    };

    return automations.sort(
      (a, b) => (orderMap[a.trigger] || 99) - (orderMap[b.trigger] || 99)
    );
  },

  /**
   * Get a single notification automation by ID.
   */
  getById: async (id: number) => {
    const automation = await prisma.notificationAutomation.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    return automation;
  },

  /**
   * Update an existing notification automation.
   * Modifiable fields: name, description, isEnabled, templateId.
   * Trigger cannot be altered via update.
   */
  update: async (id: number, data: UpdateNotificationAutomationInput) => {
    const existing = await prisma.notificationAutomation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Notification automation tidak ditemukan");
    }

    if (data.templateId !== undefined && data.templateId !== null) {
      const template = await prisma.notificationTemplate.findFirst({
        where: { id: data.templateId, deletedAt: null },
      });

      if (!template) {
        throw new Error("Notification template tidak ditemukan atau telah dihapus");
      }

      // Validate category mismatch
      const allowedCategories: Record<NotificationTrigger, string[]> = {
        WORK_ORDER_CREATED: ["WORK_ORDER_CREATED", "CUSTOM"],
        WORK_ORDER_IN_PROGRESS: ["WORK_ORDER_UPDATED", "WORK_ORDER_IN_PROGRESS", "CUSTOM"],
        WORK_ORDER_COMPLETED: ["WORK_ORDER_COMPLETED", "CUSTOM"],
      };

      const allowed = allowedCategories[existing.trigger] || ["CUSTOM"];
      if (!allowed.includes(template.category)) {
        throw new Error("TEMPLATE_CATEGORY_MISMATCH: Kategori template tidak sesuai dengan trigger automation.");
      }
    }

    const updatePayload: Record<string, any> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.isEnabled !== undefined) updatePayload.isEnabled = data.isEnabled;
    if (data.templateId !== undefined) updatePayload.templateId = data.templateId;

    const updated = await prisma.notificationAutomation.update({
      where: { id },
      data: updatePayload,
      include: {
        template: true,
      },
    });

    return updated;
  },

  /**
   * Toggle the isEnabled status of a notification automation.
   */
  toggle: async (id: number, isEnabled: boolean) => {
    const existing = await prisma.notificationAutomation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Notification automation tidak ditemukan");
    }

    const updated = await prisma.notificationAutomation.update({
      where: { id },
      data: { isEnabled },
      include: {
        template: true,
      },
    });

    return updated;
  },

  /**
   * Find an active automation by trigger.
   * Returns null if disabled or not found.
   */
  getByTrigger: async (trigger: NotificationTrigger) => {
    const automation = await prisma.notificationAutomation.findFirst({
      where: {
        trigger,
        isEnabled: true,
      },
      include: {
        template: true,
      },
    });

    return automation;
  },
};
