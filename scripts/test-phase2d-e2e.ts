import { prisma } from "../lib/prisma";
import { NotificationTrigger, NotificationStatus } from "@prisma/client";
import { NotificationAutomationService } from "../lib/services/notification-automation.service";
import { NotificationHistoryService } from "../lib/services/notification-history.service";
import { NotificationAutomationEngineService } from "../lib/notifications/notification-automation-engine.service";
import { defaultNotificationService } from "../lib/notifications/notification.service";

const stats = {
  providerCalls: 0,
};

const getCalls = () => stats.providerCalls;

async function runE2ETests() {
  console.log("==================================================");
  console.log("STARTING PRODUCTION HARDENING & E2E TESTS (FASE 2D)");
  console.log("==================================================");

  // Setup database mock data
  let customer = await prisma.customer.findFirst({ where: { name: "Hardening Customer" } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: "Hardening Customer", phone: "081234567890" },
    });
  }

  let vehicle = await prisma.vehicle.findFirst({ where: { customerId: customer.id } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        plateNumber: "B 2000 HARD",
        brand: "Toyota",
        model: "Yaris",
        transmission: "AUTOMATIC",
      },
    });
  }

  let workOrder = await prisma.workOrder.create({
    data: {
      code: `WO-HARD-${Date.now()}`,
      customerId: customer.id,
      vehicleId: vehicle.id,
      status: "PENDING",
      grandTotal: 150000,
      subtotal: 150000,
    },
  });

  let template = await prisma.notificationTemplate.findFirst({ where: { name: "Hardening Template" } });
  if (!template) {
    template = await prisma.notificationTemplate.create({
      data: {
        name: "Hardening Template",
        category: "WORK_ORDER_CREATED",
        message: "Halo {{customer_name}}, WO Anda {{work_order_number}} dengan tagihan {{grand_total}}. Salam!",
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

  // Mock sendText
  let mockSuccess = true;
  let mockErrorMsg = "Mock network error";

  defaultNotificationService.sendText = async (payload) => {
    stats.providerCalls++;
    if (mockSuccess) {
      return {
        success: true,
        provider: "fonnte",
        messageId: `msg_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        provider: "fonnte",
        error: mockErrorMsg,
      };
    }
  };

  const clearLogs = async () => {
    await prisma.notificationHistory.deleteMany({
      where: { workOrderId: workOrder.id },
    });
    stats.providerCalls = 0;
  };

  // --------------------------------------------------
  // SCENARIO 1: Automation Disabled
  // --------------------------------------------------
  console.log("\n[Scenario 1] Automation disabled check");
  await NotificationAutomationService.update(createdAuto.id, { isEnabled: false });
  await clearLogs();

  const res1 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res1.executed !== false || res1.reason !== "AUTOMATION_NOT_FOUND_OR_DISABLED") {
    throw new Error("Scenario 1 failed");
  }
  console.log("✓ Scenario 1 passed");

  // Re-enable for subsequent tests
  await NotificationAutomationService.update(createdAuto.id, { isEnabled: true });

  // --------------------------------------------------
  // SCENARIO 2: Template not configured
  // --------------------------------------------------
  console.log("\n[Scenario 2] Template not configured check");
  await NotificationAutomationService.update(createdAuto.id, { templateId: null });
  await clearLogs();

  const res2 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res2.executed !== false || res2.reason !== "TEMPLATE_NOT_CONFIGURED") {
    throw new Error("Scenario 2 failed");
  }
  console.log("✓ Scenario 2 passed");

  // Restore template
  await NotificationAutomationService.update(createdAuto.id, { templateId: template.id });

  // --------------------------------------------------
  // SCENARIO 3: Work Order not found
  // --------------------------------------------------
  console.log("\n[Scenario 3] Work order not found check");
  const res3 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    999999
  );
  if (res3.success !== false || res3.reason !== "WORK_ORDER_NOT_FOUND") {
    throw new Error("Scenario 3 failed");
  }
  console.log("✓ Scenario 3 passed");

  // --------------------------------------------------
  // SCENARIO 4: Customer / Phone Number clean & validation
  // --------------------------------------------------
  console.log("\n[Scenario 4] Customer and phone validation (invalid phone)");
  const invalidCustomer = await prisma.customer.create({
    data: { name: "No Phone Customer", phone: "abc-123" },
  });
  const invalidWO = await prisma.workOrder.create({
    data: {
      code: `WO-INVALID-${Date.now()}`,
      customerId: invalidCustomer.id,
      vehicleId: vehicle.id,
      status: "PENDING",
      grandTotal: 100000,
      subtotal: 100000,
    },
  });

  const res4 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    invalidWO.id
  );
  if (res4.success !== false || res4.reason !== "PHONE_INVALID") {
    throw new Error("Scenario 4 failed");
  }
  console.log("✓ Scenario 4 passed");

  // Cleanup invalid WO/Customer
  await prisma.workOrder.delete({ where: { id: invalidWO.id } });
  await prisma.customer.delete({ where: { id: invalidCustomer.id } });

  // --------------------------------------------------
  // SCENARIO 5: Template rendering & unresolved variables
  // --------------------------------------------------
  console.log("\n[Scenario 5] Template rendering & unresolved variables check");
  await clearLogs();
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";

  const res5 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (!res5.rendered?.message.includes("Hardening Customer") || !res5.rendered?.message.includes("150.000")) {
    throw new Error("Scenario 5 rendering failed");
  }
  console.log("✓ Scenario 5 passed");

  // --------------------------------------------------
  // SCENARIO 6: DRY_RUN Mode produces SIMULATED
  // --------------------------------------------------
  console.log("\n[Scenario 6] DRY_RUN mode produces SIMULATED history log");
  await clearLogs();
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";

  const res6 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res6.history?.status !== "SIMULATED" || getCalls() !== 0) {
    throw new Error("Scenario 6 failed");
  }
  console.log("✓ Scenario 6 passed");

  // --------------------------------------------------
  // SCENARIO 7: LIVE success path (PENDING -> PROCESSING -> SENT)
  // --------------------------------------------------
  console.log("\n[Scenario 7] LIVE success produces SENT history log");
  await clearLogs();
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  process.env.AUTOMATION_LIVE_ENABLED = "true";
  process.env.AUTOMATION_TEST_WORK_ORDER_ID = String(workOrder.id);
  mockSuccess = true;

  const res7 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res7.history?.status !== "SENT" || getCalls() !== 1) {
    throw new Error("Scenario 7 failed");
  }
  console.log("✓ Scenario 7 passed");

  // --------------------------------------------------
  // SCENARIO 8: LIVE failure path (PENDING -> PROCESSING -> FAILED)
  // --------------------------------------------------
  console.log("\n[Scenario 8] LIVE failure produces FAILED history log");
  await clearLogs();
  mockSuccess = false;

  const res8 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res8.history?.status !== "FAILED" || getCalls() !== 1) {
    throw new Error("Scenario 8 failed");
  }
  console.log("✓ Scenario 8 passed");

  // --------------------------------------------------
  // SCENARIO 9: Deduplication blocks duplicate SENT execution
  // --------------------------------------------------
  console.log("\n[Scenario 9] Deduplication blocks duplicate LIVE SENT execution");
  await clearLogs();
  mockSuccess = true;

  // First run (success)
  await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );

  // Second run (duplicate block)
  const res9 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res9.executed !== false || res9.reason !== "DUPLICATE_AUTOMATION_EXECUTION") {
    throw new Error("Scenario 9 failed");
  }
  console.log("✓ Scenario 9 passed");

  // --------------------------------------------------
  // SCENARIO 10: FAILED history does NOT block new attempt
  // --------------------------------------------------
  console.log("\n[Scenario 10] FAILED status does NOT block new attempt");
  await clearLogs();

  // Create failed history log
  mockSuccess = false;
  await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );

  // Attempt second send (should not block, should execute)
  mockSuccess = true;
  const res10 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res10.executed !== true || res10.history?.status !== "SENT") {
    throw new Error("Scenario 10 failed");
  }
  console.log("✓ Scenario 10 passed");

  // --------------------------------------------------
  // SCENARIO 11: SIMULATED history does NOT block LIVE execution
  // --------------------------------------------------
  console.log("\n[Scenario 11] SIMULATED history does NOT block LIVE execution");
  await clearLogs();

  // Create simulated history
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";
  await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );

  // Switch to LIVE, must send message successfully
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  process.env.AUTOMATION_LIVE_ENABLED = "true";
  process.env.AUTOMATION_TEST_WORK_ORDER_ID = String(workOrder.id);
  mockSuccess = true;

  const res11 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res11.executed !== true || res11.history?.status !== "SENT" || getCalls() !== 1) {
    throw new Error("Scenario 11 failed");
  }
  console.log("✓ Scenario 11 passed");

  // --------------------------------------------------
  // SCENARIO 12: Retry FAILED works successfully
  // --------------------------------------------------
  console.log("\n[Scenario 12] Retry FAILED history works successfully");
  await clearLogs();
  mockSuccess = false;

  // Create FAILED
  const failedExec = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  const failedId = failedExec.historyId!;

  // Retry
  mockSuccess = true;
  const retried = await NotificationHistoryService.retryNotification(failedId);
  if (retried.status !== "SENT" || retried.retryCount !== 1) {
    throw new Error("Scenario 12 failed");
  }
  console.log("✓ Scenario 12 passed");

  // --------------------------------------------------
  // SCENARIO 13: Retry SIMULATED is rejected
  // --------------------------------------------------
  console.log("\n[Scenario 13] Retry SIMULATED is rejected");
  await clearLogs();
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";

  const dryExec = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  const dryId = dryExec.historyId!;

  try {
    await NotificationHistoryService.retryNotification(dryId);
    throw new Error("Scenario 13 should have failed but did not");
  } catch (err: any) {
    if (!err.message.includes("simulasi tidak dapat dikirim ulang")) {
      throw err;
    }
  }
  console.log("✓ Scenario 13 passed");

  // --------------------------------------------------
  // SCENARIO 14: Parallel Race Condition check (Locking)
  // --------------------------------------------------
  console.log("\n[Scenario 14] Parallel executions race condition check (Locking)");
  await clearLogs();
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  process.env.AUTOMATION_LIVE_ENABLED = "true";
  process.env.AUTOMATION_TEST_WORK_ORDER_ID = String(workOrder.id);
  mockSuccess = true;

  // Fire 5 concurrent requests simultaneously
  const results = await Promise.all([
    NotificationAutomationEngineService.executeForWorkOrder(NotificationTrigger.WORK_ORDER_CREATED, workOrder.id),
    NotificationAutomationEngineService.executeForWorkOrder(NotificationTrigger.WORK_ORDER_CREATED, workOrder.id),
    NotificationAutomationEngineService.executeForWorkOrder(NotificationTrigger.WORK_ORDER_CREATED, workOrder.id),
    NotificationAutomationEngineService.executeForWorkOrder(NotificationTrigger.WORK_ORDER_CREATED, workOrder.id),
    NotificationAutomationEngineService.executeForWorkOrder(NotificationTrigger.WORK_ORDER_CREATED, workOrder.id),
  ]);

  const executedCount = results.filter((r) => r.executed === true).length;
  const duplicateCount = results.filter((r) => r.reason === "DUPLICATE_AUTOMATION_EXECUTION").length;

  console.log(`Parallel Results: Executed = ${executedCount}, Duplicates Blocked = ${duplicateCount}`);

  if (executedCount !== 1 || duplicateCount !== 4 || getCalls() !== 1) {
    throw new Error("Scenario 14 failed: parallel executions race condition detected!");
  }
  console.log("✓ Scenario 14 passed: pessimistic locking successfully serialized concurrent executions.");

  // Cleanup Database
  await prisma.notificationHistory.deleteMany({
    where: { workOrderId: workOrder.id },
  });
  await prisma.workOrder.delete({
    where: { id: workOrder.id },
  });

  // Restore default environments
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";
  process.env.AUTOMATION_LIVE_ENABLED = "false";
  delete process.env.AUTOMATION_TEST_WORK_ORDER_ID;
  delete process.env.AUTOMATION_TEST_TRIGGER;

  console.log("\n==================================================");
  console.log("ALL E2E HARDENING SCENARIOS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runE2ETests()
  .catch((e) => {
    console.error("\n❌ E2E TESTING HARDENING FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
