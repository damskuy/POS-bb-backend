import { prisma } from "../lib/prisma";
import { NotificationTrigger, NotificationStatus } from "@prisma/client";
import { NotificationAutomationService } from "../lib/services/notification-automation.service";
import { NotificationHistoryService } from "../lib/services/notification-history.service";
import { NotificationAutomationEngineService } from "../lib/notifications/notification-automation-engine.service";
import { getEffectiveAutomationExecutionMode } from "../lib/notifications/automation-execution.config";

async function runPhase2B1Tests() {
  console.log("==================================================");
  console.log("STARTING PHASE 2B-1 AUTOMATION INTEGRATION TESTS");
  console.log("==================================================");

  // Setup sample test database records
  let customer = await prisma.customer.findFirst();
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: "Budi Wijaya", phone: "081234567890" },
    });
  }

  let vehicle = await prisma.vehicle.findFirst({ where: { customerId: customer.id } });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        plateNumber: "B 7777 XYZ",
        brand: "Honda",
        model: "Vario 125",
        transmission: "AUTOMATIC",
      },
    });
  }

  let workOrder = await prisma.workOrder.create({
    data: {
      code: `WO-P2B1-${Date.now()}`,
      customerId: customer.id,
      vehicleId: vehicle.id,
      status: "PENDING",
      grandTotal: 500000,
      subtotal: 500000,
    },
  });

  let template = await prisma.notificationTemplate.findFirst({ where: { deletedAt: null } });
  if (!template) {
    template = await prisma.notificationTemplate.create({
      data: {
        name: "Test Template WO Created",
        category: "WORK_ORDER_CREATED",
        message: "Halo {{customer_name}}, WO {{work_order_number}} Rp{{grand_total}}",
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

  // Clean previous history for this WO
  await prisma.notificationHistory.deleteMany({
    where: { workOrderId: workOrder.id },
  });

  // TEST 1: DRY_RUN default
  console.log("\n[Test 1] DRY_RUN default");
  process.env.AUTOMATION_EXECUTION_MODE = "DRY_RUN";
  process.env.AUTOMATION_LIVE_ENABLED = "false";

  const res1 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  console.log("Result 1:", JSON.stringify(res1, null, 2));

  if (!res1.success || !res1.executed || res1.mode !== "DRY_RUN") {
    throw new Error("Test 1 execution properties failed");
  }
  if (!res1.history || res1.history.status !== "SIMULATED") {
    throw new Error("Test 1 did not record history as SIMULATED");
  }

  // Fetch from DB to verify
  const historyRec = await NotificationHistoryService.getHistoryById(res1.history.id);
  if (!historyRec || historyRec.status !== NotificationStatus.SIMULATED) {
    throw new Error("History record in DB is not SIMULATED");
  }
  console.log("✓ Test 1 passed: SIMULATED history record created.");

  // TEST 2: AUTOMATION_EXECUTION_MODE undefined
  console.log("\n[Test 2] Config Helper - Undefined");
  delete process.env.AUTOMATION_EXECUTION_MODE;
  const config2 = getEffectiveAutomationExecutionMode();
  if (config2.mode !== "DRY_RUN" || config2.reason !== "AUTOMATION_DRY_RUN") {
    throw new Error("Test 2 failed");
  }
  console.log("✓ Test 2 passed: falls back to DRY_RUN / AUTOMATION_DRY_RUN.");

  // TEST 3: AUTOMATION_EXECUTION_MODE invalid
  console.log("\n[Test 3] Config Helper - Invalid");
  process.env.AUTOMATION_EXECUTION_MODE = "INVALID";
  const config3 = getEffectiveAutomationExecutionMode();
  if (config3.mode !== "DRY_RUN" || config3.reason !== "AUTOMATION_DRY_RUN") {
    throw new Error("Test 3 failed");
  }
  console.log("✓ Test 3 passed: falls back to DRY_RUN.");

  // TEST 4: LIVE asked but LIVE_ENABLED false
  console.log("\n[Test 4] LIVE safety gate");
  process.env.AUTOMATION_EXECUTION_MODE = "LIVE";
  process.env.AUTOMATION_LIVE_ENABLED = "false";
  const config4 = getEffectiveAutomationExecutionMode();
  if (config4.mode !== "DRY_RUN" || config4.reason !== "LIVE_NOT_ENABLED") {
    throw new Error("Test 4 failed");
  }
  console.log("✓ Test 4 passed: safety gate prevented LIVE mode (LIVE_NOT_ENABLED).");

  // TEST 10: Deduplication check
  console.log("\n[Test 10] Deduplication prevention");
  // Try executing again for the same trigger & work order
  const res10 = await NotificationAutomationEngineService.executeForWorkOrder(
    NotificationTrigger.WORK_ORDER_CREATED,
    workOrder.id
  );
  console.log("Result 10:", JSON.stringify(res10, null, 2));
  if (res10.executed !== false || res10.reason !== "DUPLICATE_AUTOMATION_EXECUTION" || res10.existingHistoryId !== res1.history.id) {
    throw new Error("Deduplication check failed!");
  }
  console.log("✓ Test 10 passed: Deduplication prevents duplicate history.");

  // TEST 11: Retry SIMULATED must fail
  console.log("\n[Test 11] Retry simulated history");
  try {
    await NotificationHistoryService.retryNotification(res1.history.id);
    throw new Error("Retry should have failed but did not!");
  } catch (err: any) {
    console.log("Retry failed as expected with message:", err.message);
    if (err.message !== "Notifikasi simulasi tidak dapat dikirim ulang") {
      throw new Error("Incorrect error message for SIMULATED retry!");
    }
  }
  console.log("✓ Test 11 passed: SIMULATED retries correctly blocked.");

  // Cleanup DB test records
  await prisma.notificationHistory.deleteMany({
    where: { workOrderId: workOrder.id },
  });
  await prisma.workOrder.delete({
    where: { id: workOrder.id },
  });

  console.log("\n==================================================");
  console.log("ALL PHASE 2B-1 TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runPhase2B1Tests()
  .catch((e) => {
    console.error("\n❌ PHASE 2B-1 TEST FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
