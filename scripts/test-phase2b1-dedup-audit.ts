import { prisma } from "../lib/prisma";
import { NotificationTrigger, NotificationStatus } from "@prisma/client";
import { NotificationAutomationService } from "../lib/services/notification-automation.service";
import { NotificationHistoryService } from "../lib/services/notification-history.service";
import { NotificationAutomationEngineService } from "../lib/notifications/notification-automation-engine.service";
import { getEffectiveAutomationExecutionMode } from "../lib/notifications/automation-execution.config";
import { defaultNotificationService } from "../lib/notifications/notification.service";

async function runDedupAuditTests() {
  console.log("==================================================");
  console.log("STARTING LOGICAL DEDUPLICATION AUDIT TESTS");
  console.log("==================================================");

  // Mock Notification Provider to prevent Fonnte network requests
  defaultNotificationService.sendText = async (payload) => {
    console.log("[MockProvider] Intercepted sendText. Target phone masked:", payload.phone.slice(0, 5) + "****");
    return {
      success: true,
      provider: "fonnte",
      messageId: "mock_fonnte_msg_98765",
    };
  };

  // Setup test records
  let customer = await prisma.customer.findFirst();
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: "Audit Budi", phone: "081122334455" },
    });
  }

  let vehicle = await prisma.vehicle.findFirst({ where: { customerId: customer.id } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        plateNumber: "B 1234 AUD",
        brand: "Suzuki",
        model: "Swift",
        transmission: "MANUAL",
      },
    });
  }

  let workOrder = await prisma.workOrder.create({
    data: {
      code: `WO-AUDIT-${Date.now()}`,
      customerId: customer.id,
      vehicleId: vehicle.id,
      status: "PENDING",
      grandTotal: 150000,
      subtotal: 150000,
    },
  });

  let template = await prisma.notificationTemplate.findFirst({ where: { deletedAt: null } });
  if (!template) {
    template = await prisma.notificationTemplate.create({
      data: {
        name: "Test Template for Audit",
        category: "WORK_ORDER_CREATED",
        message: "Halo {{customer_name}}, WO {{work_order_number}}",
      },
    });
  }

  await NotificationAutomationService.ensureDefaultAutomations();
  const automations = await NotificationAutomationService.getAll();
  const createdAuto = automations.find((a) => a.trigger === NotificationTrigger.WORK_ORDER_CREATED)!;

  await NotificationAutomationService.update(createdAuto.id, {
    templateId: template.id,
    isEnabled: true,
  });

  // Clean history for this WorkOrder before testing
  await prisma.notificationHistory.deleteMany({
    where: { workOrderId: workOrder.id },
  });

  // --------------------------------------------------
  // TEST A: DRY_RUN run twice for same combination
  // --------------------------------------------------
  console.log("\n[Test A] Running DRY_RUN twice...");
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";
  process.env.AUTOMATION_LIVE_ENABLED = "false";

  // First run
  const resA1 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (!resA1.success || !resA1.executed || !resA1.history || resA1.history.status !== "SIMULATED") {
    throw new Error("Test A1 first execution failed to create SIMULATED history");
  }

  // Second run
  const resA2 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (resA2.executed !== false || resA2.reason !== "DUPLICATE_AUTOMATION_EXECUTION" || resA2.existingHistoryId !== resA1.history.id) {
    throw new Error("Test A2 second execution was not blocked by duplicate SIMULATED status");
  }
  console.log("✓ Test A passed: Second DRY_RUN was successfully blocked by duplicate SIMULATED status.");

  // --------------------------------------------------
  // TEST B: DRY_RUN followed by LIVE execution
  // --------------------------------------------------
  console.log("\n[Test B] DRY_RUN followed by LIVE execution...");
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  process.env.AUTOMATION_LIVE_ENABLED = "true";

  const resB = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  console.log("Result B:", JSON.stringify(resB, null, 2));
  if (!resB.success || !resB.executed || resB.mode !== "LIVE") {
    throw new Error("Test B failed: LIVE execution was blocked by SIMULATED log");
  }
  if (!resB.history || resB.history.status !== "SENT") {
    throw new Error("Test B failed to create or update history to SENT status");
  }

  // Verify SIMULATED log is still untouched
  const oldSimulatedLog = await NotificationHistoryService.getHistoryById(resA1.history.id);
  if (!oldSimulatedLog || oldSimulatedLog.status !== "SIMULATED") {
    throw new Error("Test B failed: Old SIMULATED log was modified or deleted");
  }
  console.log("✓ Test B passed: LIVE was NOT blocked by SIMULATED, and old SIMULATED log remained intact.");

  // --------------------------------------------------
  // TEST C: LIVE run followed by another trigger (SENT blocks execution)
  // --------------------------------------------------
  console.log("\n[Test C] LIVE run followed by another trigger (SENT blocks execution)...");
  const resC = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (resC.executed !== false || resC.reason !== "DUPLICATE_AUTOMATION_EXECUTION" || resC.existingHistoryId !== resB.history.id) {
    throw new Error("Test C failed: Execution was not blocked by existing SENT status");
  }
  console.log("✓ Test C passed: Trigger successfully blocked by existing SENT status.");

  // --------------------------------------------------
  // TEST D: FAILED does NOT block execution
  // --------------------------------------------------
  console.log("\n[Test D] FAILED does NOT block execution...");
  // Manually mark the log as FAILED
  await prisma.notificationHistory.update({
    where: { id: resB.history.id },
    data: { status: NotificationStatus.FAILED },
  });

  const resD = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (!resD.success || !resD.executed || resD.history?.id === resB.history.id) {
    throw new Error("Test D failed: Execution was blocked by FAILED status or reused the old log ID");
  }
  console.log(`✓ Test D passed: FAILED status did not block execution. New history record ${resD.history?.id} created.`);

  // Cleanup test database records
  await prisma.notificationHistory.deleteMany({
    where: { workOrderId: workOrder.id },
  });
  await prisma.workOrder.delete({
    where: { id: workOrder.id },
  });

  // Restore env
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";
  process.env.AUTOMATION_LIVE_ENABLED = "false";

  console.log("\n==================================================");
  console.log("ALL DEDUPLICATION AUDIT TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runDedupAuditTests()
  .catch((e) => {
    console.error("\n❌ DEDUPLICATION AUDIT TEST FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
