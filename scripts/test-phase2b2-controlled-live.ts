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

async function runControlledLiveTests() {
  console.log("==================================================");
  console.log("STARTING CONTROLLED LIVE TEST SUITE (FASE 2B-2)");
  console.log("==================================================");

  // Setup test records
  let customer = await prisma.customer.findFirst();
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: "Budi Safety", phone: "081234567890" },
    });
  }

  let vehicle = await prisma.vehicle.findFirst({ where: { customerId: customer.id } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        plateNumber: "B 1000 SAF",
        brand: "Toyota",
        model: "Avanza",
        transmission: "MANUAL",
      },
    });
  }

  let workOrder = await prisma.workOrder.create({
    data: {
      code: `WO-SAFETY-${Date.now()}`,
      customerId: customer.id,
      vehicleId: vehicle.id,
      status: "PENDING",
      grandTotal: 250000,
      subtotal: 250000,
    },
  });

  let template = await prisma.notificationTemplate.findFirst({ where: { deletedAt: null } });
  if (!template) {
    template = await prisma.notificationTemplate.create({
      data: {
        name: "Controlled Live Test Template",
        category: "WORK_ORDER_CREATED",
        message: "Halo {{customer_name}}, WO Anda {{work_order_number}}",
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

  let mockSuccess: boolean = true;
  let mockErrorMsg = "Fonnte server error mock";

  defaultNotificationService.sendText = async (payload) => {
    stats.providerCalls++;
    if (mockSuccess) {
      return {
        success: true,
        provider: "fonnte",
        messageId: `mock_message_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        provider: "fonnte",
        error: mockErrorMsg,
      };
    }
  };

  const clearHistory = async () => {
    await prisma.notificationHistory.deleteMany({
      where: { workOrderId: workOrder.id },
    });
    stats.providerCalls = 0;
  };

  // --------------------------------------------------
  // TEST 1: AUTOMATION_EXECUTION_MODE not set
  // --------------------------------------------------
  console.log("\n[Test 1] Mode not set (defaults to DRY_RUN)");
  delete process.env.AUTOMATION_EXECUTION_MODE;
  delete process.env.AUTOMATION_LIVE_ENABLED;
  await clearHistory();

  const res1 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res1.effectiveMode !== "DRY_RUN" || res1.delivery?.providerCalled !== false || getCalls() !== 0) {
    throw new Error("Test 1 failed");
  }
  console.log("✓ Test 1 passed.");

  // --------------------------------------------------
  // TEST 2: AUTOMATION_EXECUTION_MODE=LIVE, AUTOMATION_LIVE_ENABLED=false
  // --------------------------------------------------
  console.log("\n[Test 2] LIVE mode but live enabled = false");
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  process.env.AUTOMATION_LIVE_ENABLED = "false";
  await clearHistory();

  const res2 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res2.effectiveMode !== "DRY_RUN" || res2.delivery?.providerCalled !== false || getCalls() !== 0) {
    throw new Error("Test 2 failed");
  }
  console.log("✓ Test 2 passed.");

  // --------------------------------------------------
  // TEST 3: LIVE active but AUTOMATION_TEST_WORK_ORDER_ID not set
  // --------------------------------------------------
  console.log("\n[Test 3] LIVE active, no test Work Order ID configured");
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  process.env.AUTOMATION_LIVE_ENABLED = "true";
  delete process.env.AUTOMATION_TEST_WORK_ORDER_ID;
  await clearHistory();

  const res3 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res3.reason !== "LIVE_TEST_WORK_ORDER_NOT_CONFIGURED" || res3.executed !== false || getCalls() !== 0) {
    throw new Error("Test 3 failed");
  }
  console.log("✓ Test 3 passed: blocked by LIVE_TEST_WORK_ORDER_NOT_CONFIGURED.");

  // --------------------------------------------------
  // TEST 4: LIVE active, Work Order mismatch
  // --------------------------------------------------
  console.log("\n[Test 4] LIVE active, Work Order ID mismatch");
  process.env.AUTOMATION_TEST_WORK_ORDER_ID = "999999"; // Non-matching WO
  await clearHistory();

  const res4 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res4.reason !== "WORK_ORDER_NOT_ALLOWED_FOR_LIVE_TEST" || res4.executed !== false || getCalls() !== 0) {
    throw new Error("Test 4 failed");
  }
  console.log("✓ Test 4 passed: blocked by WORK_ORDER_NOT_ALLOWED_FOR_LIVE_TEST.");

  // --------------------------------------------------
  // TEST 5: LIVE active, Work Order matches, trigger mismatch
  // --------------------------------------------------
  console.log("\n[Test 5] LIVE active, Work Order matches, trigger mismatch");
  process.env.AUTOMATION_TEST_WORK_ORDER_ID = String(workOrder.id);
  process.env.AUTOMATION_TEST_TRIGGER = "WORK_ORDER_COMPLETED"; // Non-matching trigger
  await clearHistory();

  const res5 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res5.reason !== "TRIGGER_NOT_ALLOWED_FOR_LIVE_TEST" || res5.executed !== false || getCalls() !== 0) {
    throw new Error("Test 5 failed");
  }
  console.log("✓ Test 5 passed: blocked by TRIGGER_NOT_ALLOWED_FOR_LIVE_TEST.");

  // --------------------------------------------------
  // TEST 6: LIVE active, Work Order and trigger match, mock provider success
  // --------------------------------------------------
  console.log("\n[Test 6] LIVE active, filters match, provider success");
  process.env.AUTOMATION_TEST_TRIGGER = "WORK_ORDER_CREATED"; // Matches
  mockSuccess = true;
  await clearHistory();

  const res6 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (!res6.success || !res6.executed || res6.effectiveMode !== "LIVE" || getCalls() !== 1) {
    throw new Error("Test 6 failed to execute live message send");
  }
  if (!res6.history || res6.history.status !== "SENT") {
    throw new Error("Test 6 final status is not SENT");
  }
  console.log("✓ Test 6 passed: successfully completed LIVE sending to SENT.");

  // --------------------------------------------------
  // TEST 7: LIVE active, Work Order and trigger match, mock provider fail
  // --------------------------------------------------
  console.log("\n[Test 7] LIVE active, filters match, provider fail");
  mockSuccess = false;
  await clearHistory();

  const res7 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res7.success !== false || !res7.executed || getCalls() !== 1) {
    throw new Error("Test 7 failed to report mock failure");
  }
  if (!res7.history || res7.history.status !== "FAILED") {
    throw new Error("Test 7 final status is not FAILED");
  }

  // Verify error is recorded in history
  const history7 = await NotificationHistoryService.getHistoryById(res7.history.id);
  if (!history7 || history7.errorMessage !== mockErrorMsg) {
    throw new Error("Test 7 failed to log error message");
  }
  console.log("✓ Test 7 passed: successfully caught provider error and logged as FAILED.");

  // --------------------------------------------------
  // TEST 8: LIVE execution success run twice (Deduplication blocks second send)
  // --------------------------------------------------
  console.log("\n[Test 8] LIVE success executed twice");
  mockSuccess = true;
  await clearHistory();

  // First run
  const res8a = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (!res8a.success || res8a.history?.status !== "SENT" || getCalls() !== 1) {
    throw new Error("Test 8a first run failed");
  }

  // Second run
  const res8b = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  if (res8b.executed !== false || res8b.reason !== "DUPLICATE_AUTOMATION_EXECUTION" || getCalls() !== 1) {
    throw new Error("Test 8b second run was not blocked by deduplication");
  }
  console.log("✓ Test 8 passed: deduplication successfully blocked duplicate LIVE delivery.");

  // Cleanup DB test records
  await prisma.notificationHistory.deleteMany({
    where: { workOrderId: workOrder.id },
  });
  await prisma.workOrder.delete({
    where: { id: workOrder.id },
  });

  // Restore env config
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";
  process.env.AUTOMATION_LIVE_ENABLED = "false";
  delete process.env.AUTOMATION_TEST_WORK_ORDER_ID;
  delete process.env.AUTOMATION_TEST_TRIGGER;

  console.log("\n==================================================");
  console.log("ALL CONTROLLED LIVE TESTS COMPLETED SUCCESSFULLY!");
  console.log("==================================================");
}

runControlledLiveTests()
  .catch((e) => {
    console.error("\n❌ CONTROLLED LIVE TEST FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
