export interface RenderContext {
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
    createdAt?: Date | string | null;
    finishedAt?: Date | string | null;
  } | null;
  variables?: Record<string, string | null | undefined>;
}

export class TemplateRendererService {
  /**
   * Render template message by replacing placeholders with actual data context.
   * Uses safe fallbacks ("-") for missing values.
   */
  static render(templateMessage: string, context: RenderContext = {}): string {
    if (!templateMessage) return "";

    const customerName =
      context.variables?.customer_name ||
      context.variables?.customerName ||
      context.customer?.name ||
      "-";

    const customerPhone =
      context.variables?.customer_phone ||
      context.variables?.customerPhone ||
      context.customer?.phone ||
      "-";

    const vehiclePlate =
      context.variables?.vehicle_plate ||
      context.variables?.vehiclePlate ||
      context.vehicle?.plateNumber ||
      "-";

    const vehicleBrand =
      context.variables?.vehicle_brand ||
      context.variables?.vehicleBrand ||
      context.vehicle?.brand ||
      "-";

    const vehicleModel =
      context.variables?.vehicle_model ||
      context.variables?.vehicleModel ||
      context.vehicle?.model ||
      "-";

    const workOrderNumber =
      context.variables?.work_order_number ||
      context.variables?.workOrderNumber ||
      context.workOrder?.code ||
      "-";

    const rawDate =
      context.variables?.service_date ||
      context.variables?.serviceDate ||
      context.workOrder?.finishedAt ||
      context.workOrder?.createdAt;

    let serviceDate = "-";
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        serviceDate = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } else {
        serviceDate = String(rawDate);
      }
    }

    const workshopName =
      context.variables?.workshop_name ||
      context.variables?.workshopName ||
      "POS BengkelBaik";

    let rendered = templateMessage
      .replace(/\{\{customer_name\}\}/g, customerName)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{customer_phone\}\}/g, customerPhone)
      .replace(/\{\{customerPhone\}\}/g, customerPhone)
      .replace(/\{\{vehicle_plate\}\}/g, vehiclePlate)
      .replace(/\{\{vehiclePlate\}\}/g, vehiclePlate)
      .replace(/\{\{vehicle_brand\}\}/g, vehicleBrand)
      .replace(/\{\{vehicleBrand\}\}/g, vehicleBrand)
      .replace(/\{\{vehicle_model\}\}/g, vehicleModel)
      .replace(/\{\{vehicleModel\}\}/g, vehicleModel)
      .replace(/\{\{work_order_number\}\}/g, workOrderNumber)
      .replace(/\{\{workOrderNumber\}\}/g, workOrderNumber)
      .replace(/\{\{service_date\}\}/g, serviceDate)
      .replace(/\{\{serviceDate\}\}/g, serviceDate)
      .replace(/\{\{workshop_name\}\}/g, workshopName)
      .replace(/\{\{workshopName\}\}/g, workshopName);

    // Replace any remaining custom manual variables
    if (context.variables) {
      for (const [key, value] of Object.entries(context.variables)) {
        if (value !== undefined && value !== null) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          rendered = rendered.replace(regex, String(value));
        }
      }
    }

    // Clean remaining unreplaced double braces with safe fallback
    rendered = rendered.replace(/\{\{[^}]+\\}\}/g, "-");

    return rendered;
  }
}
