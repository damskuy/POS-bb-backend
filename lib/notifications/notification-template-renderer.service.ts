export interface AutomationRenderContext {
  customer?: {
    name?: string | null;
    phone?: string | null;
  } | null;
  vehicle?: {
    brand?: string | null;
    model?: string | null;
    plateNumber?: string | null;
  } | null;
  workOrder?: {
    code?: string | null;
    status?: string | null;
    grandTotal?: number | null;
    subtotal?: number | null;
    discount?: number | null;
    tax?: number | null;
    odometer?: number | null;
    createdAt?: Date | string | null;
    finishedAt?: Date | string | null;
  } | null;
  workshopName?: string;
  customVariables?: Record<string, string | number | null | undefined>;
}

export interface RenderResult {
  message: string;
  unresolvedVariables: string[];
}

export class NotificationTemplateRendererService {
  /**
   * Format numbers to Indonesian currency style (e.g. 350000 -> 350.000).
   */
  private static formatRupiahNumber(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return new Intl.NumberFormat("id-ID").format(val);
  }

  /**
   * Format date to Indonesian locale (e.g. 31 Juli 2026).
   */
  private static formatDateIndonesian(val: Date | string | null | undefined): string {
    if (!val) return "-";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /**
   * Safely render a template string by replacing known placeholders with context values.
   * Tracks unresolved placeholders and leaves them intact in the message.
   */
  static render(
    templateMessage: string,
    context: AutomationRenderContext = {}
  ): RenderResult {
    if (!templateMessage) {
      return { message: "", unresolvedVariables: [] };
    }

    const customer = context.customer || {};
    const vehicle = context.vehicle || {};
    const wo = context.workOrder || {};
    const workshopName = context.workshopName || "POS Bengkel Baik";

    const vehicleName = [vehicle.brand, vehicle.model]
      .filter(Boolean)
      .join(" ") || vehicle.plateNumber || "-";

    const knownReplacements: Record<string, string> = {
      // Customer
      customer_name: customer.name || "-",
      customerName: customer.name || "-",
      customer_phone: customer.phone || "-",
      customerPhone: customer.phone || "-",

      // Work Order
      work_order_number: wo.code || "-",
      workOrderNumber: wo.code || "-",
      work_order_status: wo.status || "-",
      workOrderStatus: wo.status || "-",

      grand_total: NotificationTemplateRendererService.formatRupiahNumber(wo.grandTotal),
      grandTotal: NotificationTemplateRendererService.formatRupiahNumber(wo.grandTotal),
      subtotal: NotificationTemplateRendererService.formatRupiahNumber(wo.subtotal),
      discount: NotificationTemplateRendererService.formatRupiahNumber(wo.discount),
      tax: NotificationTemplateRendererService.formatRupiahNumber(wo.tax),
      odometer: wo.odometer !== null && wo.odometer !== undefined ? `${wo.odometer} km` : "-",

      created_at: NotificationTemplateRendererService.formatDateIndonesian(wo.createdAt),
      createdAt: NotificationTemplateRendererService.formatDateIndonesian(wo.createdAt),
      finished_at: NotificationTemplateRendererService.formatDateIndonesian(wo.finishedAt),
      finishedAt: NotificationTemplateRendererService.formatDateIndonesian(wo.finishedAt),
      service_date: NotificationTemplateRendererService.formatDateIndonesian(wo.finishedAt || wo.createdAt),
      serviceDate: NotificationTemplateRendererService.formatDateIndonesian(wo.finishedAt || wo.createdAt),

      // Vehicle
      vehicle_plate: vehicle.plateNumber || "-",
      vehiclePlate: vehicle.plateNumber || "-",
      vehicle_brand: vehicle.brand || "-",
      vehicleBrand: vehicle.brand || "-",
      vehicle_model: vehicle.model || "-",
      vehicleModel: vehicle.model || "-",
      vehicle_name: vehicleName,
      vehicleName: vehicleName,

      // Workshop
      workshop_name: workshopName,
      workshopName: workshopName,
    };

    // Include custom manual variables if passed
    if (context.customVariables) {
      for (const [k, v] of Object.entries(context.customVariables)) {
        if (v !== undefined && v !== null) {
          knownReplacements[k] = String(v);
        }
      }
    }

    let renderedMessage = templateMessage;

    // 1. Replace all known placeholders
    for (const [key, value] of Object.entries(knownReplacements)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      renderedMessage = renderedMessage.replace(regex, value);
    }

    // 2. Identify unresolved placeholders matching {{var_name}}
    const unresolvedSet = new Set<string>();
    const matches = renderedMessage.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);

    if (matches) {
      for (const m of matches) {
        const varName = m.slice(2, -2).trim();
        unresolvedSet.add(varName);
      }
    }

    return {
      message: renderedMessage,
      unresolvedVariables: Array.from(unresolvedSet),
    };
  }
}
